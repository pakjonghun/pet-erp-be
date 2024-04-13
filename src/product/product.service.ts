import * as ExcelJS from 'exceljs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductRepository } from './entities/product.repository';
import { ProductInterface } from './entities/product.entity';
import { UtilService } from 'src/common/services/util.service';
import { ColumnOption } from 'src/client/types';

@Injectable()
export class ProductService {
  constructor(
    private readonly utilService: UtilService,
    private readonly productRepository: ProductRepository,
  ) {}

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
}
