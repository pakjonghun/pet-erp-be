import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubsidiaryCategoryService } from './subsidiary-category.service';
import { SubsidiaryCategory } from './entities/subsidiary-category.entity';
import { CreateSubsidiaryCategoryInput } from './dto/create-subsidiary-category.input';
import { UpdateSubsidiaryCategoryInput } from './dto/update-subsidiary-category.input';
import { SubsidiaryCategoriesInput } from './dto/subsidiary-categories.input';
import { SubsidiaryCategoriesOutput } from './dto/subsidiary-categories.output';

@Resolver(() => SubsidiaryCategory)
export class SubsidiaryCategoryResolver {
  constructor(
    private readonly subsidiaryCategoryService: SubsidiaryCategoryService,
  ) {}

  @Mutation(() => SubsidiaryCategory)
  createSubsidiaryCategory(
    @Args('createSubsidiaryCategoryInput')
    createSubsidiaryCategoryInput: CreateSubsidiaryCategoryInput,
  ) {
    return this.subsidiaryCategoryService.create(createSubsidiaryCategoryInput);
  }

  @Query(() => SubsidiaryCategoriesOutput, { name: 'subsidiaryCategories' })
  subsidiaryCategories(
    @Args('subsidiaryCategoriesInput')
    subsidiaryCategoriesInput: SubsidiaryCategoriesInput,
  ) {
    return this.subsidiaryCategoryService.findMany(subsidiaryCategoriesInput);
  }

  @Mutation(() => SubsidiaryCategory)
  updateSubsidiaryCategory(
    @Args('updateSubsidiaryCategoryInput')
    updateSubsidiaryCategoryInput: UpdateSubsidiaryCategoryInput,
  ) {
    return this.subsidiaryCategoryService.update(updateSubsidiaryCategoryInput);
  }

  @Mutation(() => SubsidiaryCategory)
  removeSubsidiaryCategory(@Args('_id') _id: string) {
    return this.subsidiaryCategoryService.remove(_id);
  }
}
