import * as ExcelJS from 'exceljs';
import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class ProductService {
  constructor(
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

  create(createProductInput: CreateProductInput) {
    return this.productRepository.create(createProductInput);
  }

  findAll() {
    return this.productRepository.findAll({});
  }

  async findOne(_id: string) {
    const result = await this.productRepository.findOne({ _id });
    if (!result) {
      throw new NotFoundException('검색된 제품이 없습니다.');
    }
  }

  update({ _id, ...body }: UpdateProductInput) {
    return this.productRepository.update({ _id }, body);
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
    };

    const documents = await this.productRepository.excelToDocuments(
      worksheet,
      colToField,
      4,
    );

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
      const todaySale = saleList.today.find(
        (sale) => sale.name === product.code,
      );
      const thisWeekSale = saleList.thisWeek.find(
        (sale) => sale.name === product.code,
      );
      const clients = saleList.clients.filter(
        (client) => client._id.productCode === product.code,
      );

      return { ...product, todaySale, thisWeekSale, clients };
    });

    return { totalCount: productList.totalCount, data: newProductList };
  }
}
