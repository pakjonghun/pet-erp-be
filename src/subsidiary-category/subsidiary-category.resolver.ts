import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SubsidiaryCategoryService } from './subsidiary-category.service';
import { SubsidiaryCategory } from './entities/subsidiary-category.entity';
import { CreateSubsidiaryCategoryInput } from './dto/create-subsidiary-category.input';
import { UpdateSubsidiaryCategoryInput } from './dto/update-subsidiary-category.input';
import { SubsidiaryCategoriesInput } from './dto/subsidiary-categories.input';

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

  @Query(() => [SubsidiaryCategory], { name: 'subsidiaryCategory' })
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
  removeSubsidiaryCategory(@Args('id', { type: () => Int }) id: number) {
    return this.subsidiaryCategoryService.remove(id);
  }
}
