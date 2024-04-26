import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductCategoryService } from './product-category.service';
import { ProductCategory } from './entities/product-category.entity';
import { CreateCategoryInput } from './dtos/create-category.input';
import { UpdateCategoryInput } from './dtos/update-category.input';
import { CategoriesInput } from './dtos/find-category.input';
import { CategoriesOutput } from './dtos/find-category.output';

@Resolver(() => ProductCategory)
export class ProductCategoryResolver {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @Mutation(() => ProductCategory)
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

  @Mutation(() => ProductCategory)
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ) {
    return this.categoryService.update(updateCategoryInput);
  }

  @Mutation(() => ProductCategory)
  async removeCategory(@Args('_id', { type: () => String }) _id: string) {
    const result = await this.categoryService.remove(_id);
    return result;
  }
}
