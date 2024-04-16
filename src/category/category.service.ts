import { Injectable } from '@nestjs/common';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CategoryRepository } from './category.repository';
import { FindCategoryInput } from './dto/find-category.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';

@Injectable()
export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  create(createCategoryInput: CreateCategoryInput) {
    return this.categoryRepository.create(createCategoryInput);
  }

  findMany({ keyword, skip, limit }: FindCategoryInput) {
    return this.categoryRepository.findMany({
      skip,
      limit,
      order: OrderEnum.DESC,
      sort: 'createdAt',
      filterQuery: { name: { $regex: keyword, $options: 'i' } },
    });
  }

  update({ _id, ...body }: UpdateCategoryInput) {
    return this.categoryRepository.update({ _id }, body);
  }

  remove(_id: string) {
    return this.categoryRepository.remove({ _id });
  }
}
