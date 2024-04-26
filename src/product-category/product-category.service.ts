import * as ExcelJS from 'exceljs';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { ProductCategoryRepository } from './product-category.repository';
import { CategoriesInput } from './dto/find-category.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { ProductService } from 'src/product/product.service';
import { FilterQuery } from 'mongoose';
import {
  ProductCategory,
  ProductCategoryInterface,
} from './entities/product-category.entity';
import { ColumnOption } from 'src/client/types';
import { UtilService } from 'src/common/services/util.service';

@Injectable()
export class ProductCategoryService {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private readonly utilService: UtilService,
    private readonly categoryRepository: ProductCategoryRepository,
  ) {}

  async create(createCategoryInput: CreateCategoryInput) {
    await this.duplicateCheck(createCategoryInput.name);
    return this.categoryRepository.create(createCategoryInput);
  }

  findMany({ keyword, skip, limit }: CategoriesInput) {
    return this.categoryRepository.findMany({
      skip,
      limit,
      order: OrderEnum.DESC,
      filterQuery: { name: { $regex: keyword, $options: 'i' } },
    });
  }

  findAll(query: FilterQuery<ProductCategory>) {
    return this.categoryRepository.findAll(query);
  }

  async duplicateCheck(name: string) {
    const isExistCategory = await this.categoryRepository.findOne({
      name,
    });

    if (isExistCategory) {
      throw new BadRequestException(`${name}은 이미 사용중인 제품분류 입니다.`);
    }
  }

  async update({ _id, ...body }: UpdateCategoryInput) {
    await this.duplicateCheck(body.name);
    return this.categoryRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const usingCategory = await this.productService.isExist({ category: _id });
    if (usingCategory) {
      throw new ConflictException('사용중인 제품분류는 삭제할 수 없습니다.');
    }
    return this.categoryRepository.remove({ _id });
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<ProductCategoryInterface>> = {
      1: { fieldName: 'name' },
    };

    const documents = await this.categoryRepository.excelToDocuments(
      worksheet,
      colToField,
      1,
    );
    this.utilService.checkDuplicatedField(documents, 'name');
    await this.categoryRepository.checkUnique(documents, 'name');
    await this.categoryRepository.bulkWrite(documents);
  }

  async findOne(filterQuery: FilterQuery<ProductCategory>) {
    return this.categoryRepository.findOne(filterQuery);
  }

  async downloadExcel() {
    const allData = this.categoryRepository.model
      .find()
      .select('-_id -createdAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [{ header: '이름', key: 'name', width: 40 }];

    for await (const doc of allData) {
      worksheet.addRow(doc.toObject());
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
