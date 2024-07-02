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
import { FilterQuery, Model } from 'mongoose';
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
import { Storage } from 'src/storage/entities/storage.entity';

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

    @InjectModel(Storage.name)
    private readonly storageModel: Model<Storage>,

    @InjectModel(Sale.name)
    private readonly saleModel: Model<Sale>,

    @InjectModel(Stock.name)
    private readonly stockModel: Model<Stock>,
  ) {}

  async totalSaleBy(
    { productCodeList, skip, limit, ...range }: FindDateInput,
    groupId?: string,
  ) {
    const prevRange = this.utilService.getBeforeDate(range);
    const current = await this.saleService.totalSale(
      range,
      groupId,
      undefined,
      productCodeList,
      skip,
      limit,
    );
    const previous = await this.saleService.totalSale(
      prevRange,
      groupId,
      undefined,
      productCodeList,
      skip,
      limit,
    );
    return { current: current?.[0], previous: previous?.[0] };
  }

  async create(createProductInput: CreateProductInput) {
    const categoryName = createProductInput.category;
    let category;
    if (categoryName) {
      category = await this.categoryService.upsert({ name: categoryName });
    }

    let storage;
    const storageName = createProductInput.storageName;
    if (storageName) {
      storage = await this.checkStorage(storageName);
    }

    if (createProductInput.name.includes(',')) {
      throw new BadRequestException('제품이름에 , 는 포함될 수 없습니다.');
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
      storageId: storage._id,
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
    if (body.name.includes(',')) {
      throw new BadRequestException('제품이름에 , 는 포함될 수 없습니다.');
    }

    const newBody = {
      ...body,
      storageId: null,
    };

    let productCategoryDoc;
    if (body.category) {
      productCategoryDoc = await this.categoryService.findOne({
        name: body.category,
      });

      if (!productCategoryDoc) {
        throw new NotFoundException(
          `${body.category}은 존재하지 않는 분류 입니다.`,
        );
      }

      newBody.category = productCategoryDoc;
    }

    let storageId;
    if (body.storageName) {
      const storage = await this.checkStorage(body.storageName);
      storageId = storage._id.toHexString();
      newBody.storageId = storageId;
    }

    await this.productRepository.update({ _id }, newBody);
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
      20: {
        fieldName: 'storageId',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 2);

    for await (const object of objectList) {
      if (object.name && typeof object.name == 'string') {
        if (object.name.includes(',')) {
          throw new BadRequestException(
            '제품 이름에는 , 를 포함할 수 없습니다.',
          );
        }
      }

      const storageName = object.storageId as string;
      if (storageName) {
        const storage = await this.checkStorage(storageName);
        object.storageId = storage._id.toHexString();
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

  async salesByProduct({ keyword, ...rest }: ProductSaleInput) {
    const productCodeList =
      await this.productRepository.productCodeList(keyword);

    return this.productRepository.salesByProduct({
      ...rest,
      productCodeList,
    });
  }

  async saleProduct(productCode: string) {
    return this.saleService.productSale(productCode);
  }

  async isExist(query: FilterQuery<ProductService>) {
    return this.productRepository.exists(query);
  }

  async downloadExcel() {
    const allData = await this.productRepository.model
      .find()
      .populate({
        path: 'category',
        select: ['name'],
      })
      .select('-_id -createdAt -updatedAt')
      .lean<Product[]>();

    const storageIdList = allData.map((item) => item.storageId);
    const storageList = await this.storageModel.find({
      _id: { $in: storageIdList },
    });
    const storageById = new Map<string, Storage>(
      storageList.map((item) => [item._id.toHexString(), item]),
    );

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
      { header: '출고창고', key: 'storageId', width: 70 },
    ];

    for await (const product of allData) {
      const newObject = {
        ...product,
        category: product?.category?.name ?? '',
        storageId: storageById.get(product.storageId)?.name,
      };

      worksheet.addRow(newObject);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private async checkStorage(storageName: string) {
    const storage = await this.storageModel
      .findOne({ name: storageName })
      .lean<Storage>();

    if (!storage) {
      throw new BadRequestException(`${storageName}창고는 존재하지 않습니다.`);
    }

    return storage;
  }
}
