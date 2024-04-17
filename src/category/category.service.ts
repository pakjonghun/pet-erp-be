import * as ExcelJS from 'exceljs';
import {
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CategoryRepository } from './category.repository';
import { CategoriesInput } from './dto/find-category.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { ProductService } from 'src/product/product.service';
import { FilterQuery } from 'mongoose';
import { Category, CategoryInterface } from './entities/category.entity';
import { ColumnOption } from 'src/client/types';
import { UtilService } from 'src/common/services/util.service';

@Injectable()
export class CategoryService {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private readonly utilService: UtilService,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  create(createCategoryInput: CreateCategoryInput) {
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

  findAll(query: FilterQuery<Category>) {
    return this.categoryRepository.findAll(query);
  }

  update({ _id, ...body }: UpdateCategoryInput) {
    return this.categoryRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const isExistingCategory = await this.productService.findOne({
      category: _id,
    });

    if (isExistingCategory) {
      throw new ConflictException('이미 제품분류를 사용중인 제품이 있습니다.');
    }

    return this.categoryRepository.remove({ _id });
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<CategoryInterface>> = {
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
}
