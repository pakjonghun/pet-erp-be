import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CategoryService } from './category.service';
import { Category } from './entities/category.entity';
import { CreateCategoryInput } from './dto/create-category.input';
import { UpdateCategoryInput } from './dto/update-category.input';
import { CategoriesInput } from './dto/find-category.input';
import { CategoriesOutput } from './dto/find-category.output';

@Resolver(() => Category)
export class CategoryResolver {
  constructor(private readonly categoryService: CategoryService) {}

  @Mutation(() => Category)
  createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ) {
    return this.categoryService.create(createCategoryInput);
  }

  @Query(() => CategoriesOutput, { name: 'categories' })
  async categories(@Args('categoriesInput') categoriesInput: CategoriesInput) {
    const result = await this.categoryService.findMany(categoriesInput);
    return result;
  }

  @Mutation(() => Category)
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ) {
    return this.categoryService.update(updateCategoryInput);
  }

  @Mutation(() => Category)
  async removeCategory(@Args('_id', { type: () => String }) _id: string) {
    const result = await this.categoryService.remove(_id);
    return result;
  }
}
