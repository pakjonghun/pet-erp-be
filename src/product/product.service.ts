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
import { ProductRepository } from './entities/product.repository';
import { Product, ProductInterface } from './entities/product.entity';
import { UtilService } from 'src/common/services/util.service';
import { ColumnOption } from 'src/client/types';
import { SaleService } from 'src/sale/sale.service';
import { FilterQuery } from 'mongoose';
import { Sale } from 'src/sale/entities/sale.entity';
import { ProductSaleInput } from './dtos/product-sale.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { ProductsInput } from './dtos/products-input';
import { ProductCategoryService } from 'src/product-category/product-category.service';

@Injectable()
export class ProductService {
  constructor(
    @Inject(forwardRef(() => ProductCategoryService))
    private readonly categoryService: ProductCategoryService,
    private readonly saleService: SaleService,
    private readonly utilService: UtilService,
    private readonly productRepository: ProductRepository,
  ) {
    this.salesByProduct({
      keyword: '',
      limit: 10,
      keywordTarget: 'code',
      order: OrderEnum.DESC,
      skip: 0,
    });
  }

  async create(createProductInput: CreateProductInput) {
    const categoryId = createProductInput.category;
    let category;
    if (categoryId) {
      category = await this.categoryService.findOne({ _id: categoryId });
      if (!category) {
        throw new NotFoundException(
          '해당 제품분류는 존재하지 않는 데이터 입니다.',
        );
      }
    }

    const isCodeExist = await this.productRepository.exists({
      code: createProductInput.code,
    });

    if (isCodeExist) {
      throw new BadRequestException(
        `${createProductInput.code}는 이미 사용중인 코드 입니다.`,
      );
    }

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
    await this.productRepository.update({ _id }, body);
    return this.findOne({ _id });
  }

  remove(_id: string) {
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
      const categoryName = object.category as string;
      if (categoryName) {
        const targetCategory = await this.categoryService.findOne({
          name: categoryName,
        });
        if (!targetCategory) {
          throw new NotFoundException(
            `${categoryName}의 제품분류는 존재하지 않습니다.`,
          );
        }
        object.category = {
          _id: targetCategory._id,
          name: targetCategory.name,
        };
      }
    }

    const documents =
      await this.productRepository.objectToDocuments(objectList);
    this.utilService.checkDuplicatedField(documents, 'code');
    await this.productRepository.checkUnique(documents, 'code');
    await this.productRepository.bulkWrite(documents);
  }

  async salesByProduct({ keyword, keywordTarget, ...query }: ProductSaleInput) {
    const productFilterQuery: FilterQuery<Product> = {
      [keywordTarget]: { $regex: keyword, $options: 'i' },
    };

    const productList = await this.productRepository.findMany({
      ...query,
      filterQuery: productFilterQuery,
    });

    const saleFilterQuery: FilterQuery<Sale> = {
      productCode: { $in: productList.data.map((product) => product.code) },
    };
    const saleList = (await this.saleService.saleBy(saleFilterQuery))[0];

    const newProductList = productList.data.map((product) => {
      const today = saleList.today.find((sale) => sale.name === product.code);
      const thisWeek = saleList.thisWeek.find(
        (sale) => sale.name === product.code,
      );

      const lastWeek = saleList.lastWeek.find(
        (sale) => sale.name === product.code,
      );

      const thisMonth = saleList.thisMonth.find(
        (sale) => sale.name === product.code,
      );

      const clients = saleList.clients.filter(
        (client) => client._id.productCode === product.code,
      );
      return { ...product, today, thisWeek, lastWeek, thisMonth, clients };
    });

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
