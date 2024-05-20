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
import * as dayjs from 'dayjs';
import { ObjectId } from 'mongodb';

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
      20: {
        fieldName: 'maintainDate',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 4);

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
    keywordTarget,
    from,
    to,
    ...query
  }: ProductSaleInput) {
    const { from: beforeFrom, to: beforeTo } = this.utilService.getBeforeDate({
      from,
      to,
    });
    const salePipeLine: PipelineStage[] = [
      {
        $match: {
          name: { $regex: keyword, $options: 'i' },
        },
      },
      {
        $lookup: {
          from: 'stocks',
          localField: '_id',
          foreignField: 'product',
          // pipeline: [
          //   {
          //     $match: {},
          //   },
          // ],
          as: 'stock_info',
        },
      },
      {
        $lookup: {
          from: 'sales',
          localField: 'code',
          foreignField: 'productCode',
          pipeline: [
            {
              $match: {
                count: { $exists: true },
                payCost: { $exists: true },
                wonCost: { $exists: true },
                saleAt: {
                  $gte: from,
                  $lte: to,
                },
              },
            },
          ],
          as: 'sale_info',
        },
      },
      {
        $lookup: {
          from: 'sales',
          localField: 'code',
          foreignField: 'productCode',
          pipeline: [
            {
              $match: {
                count: { $exists: true },
                payCost: { $exists: true },
                wonCost: { $exists: true },
                saleAt: {
                  $gte: beforeFrom,
                  $lte: beforeTo,
                },
              },
            },
          ],
          as: 'prev_sale_info',
        },
      },
      {
        $lookup: {
          as: 'order_info',
          from: 'productorders',
          let: { productId: '$_id' },
          pipeline: [
            {
              $match: {
                products: { $exists: true, $ne: [] },
                isDone: false,
              },
            },
            {
              $project: {
                createdAt: 1,
                products: 1,
              },
            },
            {
              $unwind: '$products',
            },
            {
              $lookup: {
                foreignField: '_id',
                from: 'products',
                localField: 'products.product',
                as: 'order_product_info',
              },
            },
            {
              $unwind: '$order_product_info',
            },
            {
              $group: {
                _id: '$_id',
                createdAt: { $first: '$createdAt' },
                maxLeadTime: { $max: '$order_product_info.leadTime' },
              },
            },
            {
              $addFields: {
                calculatedDate: {
                  $dateAdd: {
                    startDate: '$createdAt',
                    unit: 'day',
                    amount: { $ifNull: ['$maxLeadTime', 0] },
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
          recentCreateDate: {
            $arrayElemAt: ['$order_info.recentCreateDate', 0],
          },
          stock: { $sum: '$stock_info.count' },
          sales: {
            accWonCost: { $sum: '$sale_info.wonCost' },
            accPayCost: { $sum: '$sale_info.payCost' },
            accCount: { $sum: '$sale_info.count' },
            name: '$name',
            prevAccWonCost: { $sum: '$prev_sale_info.wonCost' },
            prevAccPayCost: { $sum: '$prev_sale_info.payCost' },
            prevAccCount: { $sum: '$prev_sale_info.count' },
          },
        },
      },
      {
        $addFields: {
          'sales.accProfit': {
            $subtract: ['$sales.accPayCost', '$sales.accWonCost'],
          },
          'sales.averagePayCost': {
            $cond: {
              if: { $gt: ['$sales.accCount', 0] },
              then: {
                $round: [
                  { $divide: ['$sales.accPayCost', '$sales.accCount'] },
                  2,
                ],
              },
              else: 0,
            },
          },
          'sales.prevAccProfit': {
            $subtract: ['$sales.prevAccPayCost', '$sales.prevAccWonCost'],
          },
          'sales.prevAveragePayCost': {
            $cond: {
              if: { $gt: ['$sales.prevAccCount', 0] },
              then: {
                $round: [
                  { $divide: ['$sales.prevAccPayCost', '$sales.prevAccCount'] },
                  0,
                ],
              },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          code: 1,
          recentCreateDate: 1,
          stock: 1,
          sales: 1,
          sale_info: 1,
        },
      },
    ];

    // 이 제품을 팔은 거래처
    // const clientPipeLine:PipelineStage[]=[
    //   {
    //     $match:{
    //       productCode:
    //     }
    //   }
    // ]

    // accPayCost
    // accCount
    // _id
    // accProfit
    // averagePayCost

    // _id: new ObjectId('662f77533918fdaf2303fbc6'),
    // code: '100026',
    // barCode: '8809928840307',
    // name: '데일리케얼_브레스(66g)',
    // wonPrice: 2948,
    // salePrice: 15800,
    // maintainDate: 2,
    // category: new ObjectId('662f77538f9e1b98bb0d67bf'),
    // createdAt: 2024-04-29T10:32:51.642Z,
    // updatedAt: 2024-04-29T10:32:51.642Z,
    // sales: {},
    //accPayCost
    // accCount
    // name
    // accProfit
    // averagePayCost
    // prevAccPayCost
    // prevAccCount
    // prevAccProfit
    // prevAveragePayCost
    // clients: [],
    // accPayCost
    // accCount
    // _id
    // accProfit
    // averagePayCost

    // stock: 0,
    // recentCreateDate: '제작중인 제품 없음'

    const resul = await this.productRepository.model.aggregate(salePipeLine);
    console.dir(resul, { depth: 10 });

    const productFilterQuery: FilterQuery<Product> = {
      [keywordTarget]: { $regex: keyword, $options: 'i' },
    };

    const productList = await this.productRepository.findMany({
      ...query,
      filterQuery: productFilterQuery,
    });

    const productIdList = productList.data.map((product) => product._id);
    const stockList = await this.stockModel
      .find({
        product: { $in: productIdList },
      })
      .lean<Stock[]>();
    const orderList = await this.productOrderModel
      .find({
        products: { $elemMatch: { product: { $in: productIdList } } },
      })
      .lean<ProductOrder[]>();

    const getStockSum = (productId: ObjectId) => {
      return stockList
        .filter(
          (stock) =>
            (stock.product as unknown as ObjectId).toHexString() ===
            productId.toHexString(),
        )
        .reduce((acc, cur) => acc + cur.count, 0);
    };

    const getRecentCreateDate = (productId: ObjectId) => {
      const today = dayjs();

      const filteredOrderList = orderList.filter((order) =>
        order.products.some(
          (item) =>
            (item.product as unknown as ObjectId).toHexString() ===
            productId.toHexString(),
        ),
      );

      if (filteredOrderList.length == 0) {
        return '제작중인 제품 없음';
      }

      const targetProduct = productList.data.find(
        (item) => item._id.toHexString() === productId.toHexString(),
      );

      if (!targetProduct) {
        return '해당 제품을 검색 할 수 없음.';
      }

      const leadTime = targetProduct.leadTime ?? 0;

      const shortestDiff = filteredOrderList.reduce((acc, cur) => {
        const curDiff = dayjs(today).diff(cur.createdAt, 'day');
        return curDiff < acc //
          ? curDiff
          : acc;
      }, Infinity);

      if (shortestDiff == Infinity) {
        return '알수 없음';
      }

      const recentCreateDate = today
        .add(shortestDiff + 1 + leadTime, 'day')
        .format('YYYY-MM-DD');
      return recentCreateDate;
    };

    const productCodeList = productList.data.map((product) => product.code);

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

    const newProductList = productList.data.map((product) => {
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

      const recentCreateDate = getRecentCreateDate(product._id);

      const stock = getStockSum(product._id);
      return {
        ...product,
        sales: newSales[0],
        clients,
        stock,
        recentCreateDate,
      };
    });

    // console.log('newProductList : ', newProductList);
    return { totalCount: productList.totalCount, data: newProductList };
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
      { header: '유지시간', key: 'maintainDate', width: 40 },
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
