import * as ExcelJS from 'exceljs';
import { Injectable } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductRepository } from './entities/product.repository';

@Injectable()
export class ProductService {
  constructor(private readonly productRepository: ProductRepository) {}

  create(createProductInput: CreateProductInput) {
    return this.productRepository.create(createProductInput);
  }

  findAll() {
    return this.productRepository.findAll({});
  }

  findOne(_id: string) {
    return this.productRepository.findOne({ _id });
  }

  update({ _id, ...body }: UpdateProductInput) {
    return this.productRepository.update({ _id }, body);
  }

  remove(_id: string) {
    return this.productRepository.remove({ _id });
  }

  upload(worksheet: ExcelJS.Worksheet) {
    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        const value = cell.value;
        // const $col$row = cell.$col$row;
        console.log(typeof value, value);
      });
    });
  }
}
