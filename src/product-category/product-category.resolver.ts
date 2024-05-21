import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductCategoryService } from './product-category.service';
import { ProductCategory } from './entities/product-category.entity';
import { CreateCategoryInput } from './dtos/create-category.input';
import { UpdateCategoryInput } from './dtos/update-category.input';
import { CategoriesInput } from './dtos/find-category.input';
import { CategoriesOutput } from './dtos/find-category.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';

@Resolver(() => ProductCategory)
export class ProductCategoryResolver {
  constructor(private readonly categoryService: ProductCategoryService) {}

  @LogData({ description: '제품분류 생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => ProductCategory)
  createCategory(
    @Args('createCategoryInput') createCategoryInput: CreateCategoryInput,
  ) {
    return this.categoryService.create(createCategoryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => CategoriesOutput, { name: 'categories' })
  async categories(@Args('categoriesInput') categoriesInput: CategoriesInput) {
    const result = await this.categoryService.findMany(categoriesInput);
    return result;
  }

  @LogData({ description: '제품분류 업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => ProductCategory)
  updateCategory(
    @Args('updateCategoryInput') updateCategoryInput: UpdateCategoryInput,
  ) {
    return this.categoryService.update(updateCategoryInput);
  }

  @LogData({ description: '제품분류 삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => ProductCategory)
  async removeCategory(@Args('_id', { type: () => String }) _id: string) {
    const result = await this.categoryService.remove(_id);
    return result;
  }
}
