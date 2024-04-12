import * as ExcelJS from 'exceljs';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProductInput } from './dto/create-product.input';
import { UpdateProductInput } from './dto/update-product.input';
import { ProductRepository } from './entities/product.repository';
import { ProductDocument, ProductInterface } from './entities/product.entity';

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

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, Partial<keyof ProductInterface>> = {
      1: 'name',
      2: 'code',
      3: 'barCode',
      4: 'wonPrice',
      13: 'leadTime',
      14: 'salePrice',
    };
    const documents: ProductDocument[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const document = this.productRepository.getDocument();
      if (row.actualCellCount < 4) {
        throw new BadRequestException(
          `${rowIndex}번째 줄에 데이터가 모두 입력되어 있지 않습니다. 필수 데이터를 입력해주세요.`,
        );
      }
      row.eachCell((cell, index) => {
        const fieldName = colToField[index] as keyof ProductInterface;
        if (fieldName) {
          document[fieldName as string] = cell.value;
          const isValid = document.$isValid(fieldName);
          if (!isValid) {
            throw new BadRequestException(
              `${cell.$col$row}에 입력된 ${cell.value ?? '입력안됨'}는 잘못된 값입니다.`,
            );
          }
        }
      });
      documents.push(document);
    });
    for await (const document of documents) {
      await document.validate();
    }

    const codeList = documents.map((d) => d.code);
    const duplicatedProduct = await this.productRepository.findOne({
      code: { $in: codeList },
    });
    if (duplicatedProduct) {
      throw new BadRequestException(
        `${duplicatedProduct.code}는 이미 입력된 코드 입니다.`,
      );
    }

    await this.productRepository.bulkWrite(documents);
  }
}
