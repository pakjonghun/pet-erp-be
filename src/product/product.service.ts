import * as ExcelJS from 'exceljs';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { CreateProductInput } from './dtos/create-product.input';
import { UpdateProductInput } from './dtos/update-product.input';
import { ProductRepository } from './product.repository';
import { Product, ProductInterface } from './entities/product.entity';
import { ColumnOption } from 'src/client/types';
import { SaleService } from 'src/sale/sale.service';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { Sale } from 'src/sale/entities/sale.entity';
import { ProductSaleInput } from './dtos/product-sale.input';
import { ProductsInput } from './dtos/products-input';
import { ProductCategoryService } from 'src/product-category/product-category.service';
import { UtilService } from 'src/util/util.service';
import { ProductSubsidiaryRepository } from './subsidiary.repository';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { InjectModel } from '@nestjs/mongoose';
import { ProductOrder } from 'src/product-order/entities/product-order.entity';
import { Stock } from 'src/stock/entities/stock.entity';

@Injectable()
export class ProductService {
  constructor(
    @Inject(forwardRef(() => ProductCategoryService))
    private readonly categoryService: ProductCategoryService,
    private readonly saleService: SaleService,
    private readonly utilService: UtilService,
    private readonly productRepository: ProductRepository,
    private readonly productSubsidiaryRepository: ProductSubsidiaryRepository,

    @InjectModel(ProductOrder.name)
    private readonly productOrderModel: Model<ProductOrder>,

    @InjectModel(Sale.name)
    private readonly saleModel: Model<Sale>,

    @InjectModel(Stock.name)
    private readonly stockModel: Model<Stock>,
  ) {}

  async totalSaleBy(range: FindDateInput, groupId?: string) {
    const prevRange = this.utilService.getBeforeDate(range);

    const current = await this.saleService.totalSale(range, groupId);
    const previous = await this.saleService.totalSale(prevRange, groupId);

    return { current, previous };
  }

  async create(createProductInput: CreateProductInput) {
    const categoryName = createProductInput.category;
    let category;
    if (categoryName) {
      category = await this.categoryService.upsert({ name: categoryName });
    }

    await this.productRepository.uniqueCheck({
      code: createProductInput.code,
    });

    await this.productRepository.uniqueCheck({
      name: createProductInput.name,
    });

    const result = await this.productRepository.create({
      ...createProductInput,
      category,
    });

    return this.findOne({ _id: result._id });
  }

  async findAll(query: FilterQuery<Product>) {
    return this.productRepository.findAll(query);
  }

  async findMany(query: ProductsInput) {
    return this.productRepository.findFullManyProducts(query);
  }

  async findOne(query: FilterQuery<Product>) {
    const result = await this.productRepository.findFullOneProduct(query);
    if (!result) {
      throw new NotFoundException('검색된 제품이 없습니다.');
    }

    return result;
  }

  async update({ _id, ...body }: UpdateProductInput) {
    if (body.category) {
      const productCategory = await this.categoryService.findOne({
        name: body.category,
      });

      if (!productCategory) {
        throw new NotFoundException(
          `${body.category}은 존재하지 않는 분류 입니다.`,
        );
      }

      const newBody = {
        ...body,
        category: productCategory,
      };
      await this.productRepository.update({ _id }, newBody);
      return this.findOne({ _id });
    }

    await this.productRepository.update({ _id }, body);
    return this.findOne({ _id });
  }

  async remove(_id: string) {
    const targetProduct = await this.findOne({ _id });
    if (!targetProduct) {
      throw new BadRequestException('해당 제품을 찾을 수 없습니다.');
    }

    const isOrderExist = await this.productOrderModel.exists({
      'products.product': _id,
    });
    if (isOrderExist) {
      throw new BadRequestException(
        '발주된 기록이 있는 제품은 삭제할 수 없습니다.',
      );
    }

    const isStockExist = await this.stockModel.exists({
      product: _id,
    });
    if (isStockExist) {
      throw new BadRequestException(
        '재고 입출고 기록이 있는 제품은 삭제할 수 없습니다.',
      );
    }

    const isSaleExist = await this.saleModel.exists({
      productCode: targetProduct.code,
    });
    if (isSaleExist) {
      throw new BadRequestException(
        '판매된 기록이 있는 제품은 삭제할 수 없습니다.',
      );
    }

    const isUsedProduct = await this.productSubsidiaryRepository.exists({
      productList: { $in: [_id] },
    });

    const isOrderedProduct = await this.productOrderModel.exists({
      products: { $elemMatch: { _id } },
    });

    if (isUsedProduct || isOrderedProduct) {
      throw new BadRequestException(
        `${_id} 제품은 사용중인 제품입니다 삭제 할 수 없습니다.`,
      );
    }

    return this.productRepository.remove({ _id });
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<ProductInterface>> = {
      1: {
        fieldName: 'name',
      },
      2: {
        fieldName: 'code',
      },
      3: {
        fieldName: 'barCode',
      },
      4: {
        fieldName: 'wonPrice',
      },
      13: {
        fieldName: 'leadTime',
      },
      14: {
        fieldName: 'salePrice',
      },
      19: {
        fieldName: 'category',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 2);

    for await (const object of objectList) {
      if (object.name && typeof object.name == 'string') {
        if (object.name.includes(',')) {
          throw new BadRequestException(
            '제품이름에는 , 를 포함할 수 없습니다.',
          );
        }
      }

      const categoryName = object.category as string;
      if (categoryName) {
        const categoryDoc = await this.categoryService.upsert({
          name: categoryName,
        });

        object.category = categoryDoc;
      }
    }

    const documents =
      await this.productRepository.objectToDocuments(objectList);
    this.utilService.checkDuplicatedField(documents, 'code');
    this.utilService.checkDuplicatedField(documents, 'name');
    await this.productRepository.docUniqueCheck(documents, 'code');
    await this.productRepository.docUniqueCheck(documents, 'name');
    await this.productRepository.bulkWrite(documents);
  }

  private getSaleQueryByDate({
    productCodeList,
    from,
    to,
  }: {
    productCodeList: string[];
    from: Date;
    to: Date;
  }): FilterQuery<Sale> {
    return {
      productCode: { $in: productCodeList },
      saleAt: {
        $exists: true,
        $gte: from,
        $lte: to,
      },
    };
  }

  async salesByProduct({
    keyword,
    from,
    to,
    order,
    sort,
    skip,
    limit,
  }: ProductSaleInput) {
    const productFilterQuery: FilterQuery<Product> = {
      name: { $regex: this.utilService.escapeRegex(keyword), $options: 'i' },
    };
    const productListPipeLine: PipelineStage[] = [
      {
        $match: productFilterQuery,
      },
      {
        $lookup: {
          as: 'stock_info',
          foreignField: 'product',
          localField: '_id',
          from: 'stocks',
        },
      },
      {
        $lookup: {
          let: { productId: '$_id' },
          from: 'productorders',
          as: 'order_info',
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$isDone', false] },
                    {
                      $gt: [
                        {
                          $size: {
                            $ifNull: ['$products', []],
                          },
                        },
                        0,
                      ],
                    },
                    { $in: ['$$productId', '$products.product'] },
                  ],
                },
              },
            },
            {
              $project: {
                orderDate: 1,
                products: 1,
              },
            },
            {
              $unwind: '$products',
            },
            {
              $lookup: {
                as: 'order_product_info',
                from: 'products',
                foreignField: '_id',
                localField: 'products.product',
              },
            },
            {
              $unwind: '$order_product_info',
            },
            {
              $group: {
                _id: '$_id',
                orderDate: { $first: '$orderDate' },
                maxLeadTime: { $max: '$order_product_info.leadTime' },
                leadTimeCount: {
                  $sum: {
                    $cond: [
                      { $ne: ['$order_product_info.leadTime', null] },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
            {
              $addFields: {
                maxLeadTime: {
                  $cond: {
                    if: { $eq: ['$leadTimeCount', 0] },
                    then: null,
                    else: '$maxLeadTime',
                  },
                },
                calculatedDate: {
                  $cond: {
                    if: { $eq: ['$maxLeadTime', null] },
                    then: '알 수 없음',
                    else: {
                      $dateToString: {
                        format: '%Y-%m-%d',
                        date: {
                          $dateAdd: {
                            startDate: '$orderDate',
                            unit: 'day',
                            amount: '$maxLeadTime',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                recentCreateDate: { $min: '$calculatedDate' },
              },
            },

            {
              $project: {
                _id: 0,
                recentCreateDate: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          stock: {
            $sum: '$stock_info.count',
          },
          recentCreateDate: {
            $arrayElemAt: ['$order_info.recentCreateDate', 0],
          },
        },
      },
      {
        $addFields: {
          totalAssetCost: { $multiply: ['$wonPrice', '$stock'] },
        },
      },
      {
        $project: {
          stock_info: 0,
          order_info: 0,
        },
      },
      {
        $sort: {
          [sort]: order ?? -1,
          _id: 1,
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
    ];
    const productList = await this.productRepository.model.aggregate<
      Product & {
        stock: number;
        totalAssetCost: number;
        recentCreateDate: string;
      }
    >(productListPipeLine);

    const totalCount =
      await this.productRepository.model.countDocuments(productFilterQuery);

    const productCodeList = productList.map((product) => product.code);
    const currentSaleFilterQuery = this.getSaleQueryByDate({
      productCodeList,
      from,
      to,
    });
    const current = (await this.saleService.saleBy(currentSaleFilterQuery))[0];
    const beforeRange = this.utilService.getBeforeDate({ from, to });
    const previousSaleFilterQuery = this.getSaleQueryByDate({
      productCodeList,
      ...beforeRange,
    });
    const previous = (
      await this.saleService.saleBy(previousSaleFilterQuery)
    )[0];
    const newProductList = productList.map((product) => {
      const productCode = product.code;
      const prevSales = previous.sales.filter((sale) => {
        return sale.name == productCode;
      });
      const sales = current.sales.filter((sale) => {
        return sale.name == productCode;
      });
      const newSales = sales.map((sale) => {
        const previousItem = prevSales.find(
          (prevSale) => prevSale._id === sale._id,
        );

        return {
          ...sale,
          prevAccPayCost: previousItem?.accPayCost,
          prevAccCount: previousItem?.accCount,
          prevAccProfit: previousItem?.accProfit,
          prevAveragePayCost: previousItem?.averagePayCost,
        };
      });

      const clients = current.clients.filter(
        (client) => client._id.productCode == productCode,
      );

      return {
        ...product,
        sales: newSales[0],
        clients,
      };
    });
    // console.log('newProductList : ', newProductList);
    return { totalCount, data: newProductList };
  }

  async saleProduct(productCode: string) {
    return this.saleService.productSale(productCode);
  }

  async isExist(query: FilterQuery<ProductService>) {
    return this.productRepository.exists(query);
  }

  async downloadExcel() {
    const allData = this.productRepository.model
      .find()
      .populate({
        path: 'category',
        select: ['name'],
      })
      .select('-_id -createdAt -updatedAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: '이름', key: 'name', width: 70 },
      { header: '코드', key: 'code', width: 40 },
      { header: '바코드', key: 'barCode', width: 40 },
      { header: '원가', key: 'wonPrice', width: 40 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '리드타임', key: 'leadTime', width: 40 },
      { header: '판매가', key: 'salePrice', width: 40 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '', key: '', width: 10 },
      { header: '분류', key: 'category', width: 40 },
    ];

    for await (const doc of allData) {
      const object = doc.toObject();
      const newObject = {
        ...object,
        category: object?.category?.name ?? '',
      };

      worksheet.addRow(newObject);
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
