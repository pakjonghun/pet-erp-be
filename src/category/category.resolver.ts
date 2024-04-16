import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { FindManyCategoryInput } from './dto/find-category.input';
import { FindManyCategoryOutput } from './dto/find-category.output';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Mutation(() => Category)
  createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ) {
    return this.categoryService.create(createCategoryInput);
  }

  @Query(() => FindManyCategoryOutput)
  findManyCategory(
    @Args('findManyCategoryInput') findCategoryInput: FindManyCategoryInput,
  ) {
    return this.categoryService.findMany(findCategoryInput);
  }

  @Mutation(() => Category)
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ) {
    return this.categoryService.update(updateCategoryInput);
  }

  @Mutation(() => Category)
  removeCategory(@Args('_id', { type: () => String }) _id: string) {
    return this.categoryService.remove(_id);
  }
}
