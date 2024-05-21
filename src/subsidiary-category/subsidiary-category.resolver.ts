import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubsidiaryCategoryService } from './subsidiary-category.service';
import { SubsidiaryCategory } from './entities/subsidiary-category.entity';
import { CreateSubsidiaryCategoryInput } from './dto/create-subsidiary-category.input';
import { UpdateSubsidiaryCategoryInput } from './dto/update-subsidiary-category.input';
import { SubsidiaryCategoriesInput } from './dto/subsidiary-categories.input';
import { SubsidiaryCategoriesOutput } from './dto/subsidiary-categories.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';

@Resolver(() => SubsidiaryCategory)
export class SubsidiaryCategoryResolver {
  constructor(
    private readonly subsidiaryCategoryService: SubsidiaryCategoryService,
  ) {}

  @LogData({ description: '부자재 분류생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => SubsidiaryCategory)
  createSubsidiaryCategory(
    @Args('createSubsidiaryCategoryInput')
    createSubsidiaryCategoryInput: CreateSubsidiaryCategoryInput,
  ) {
    return this.subsidiaryCategoryService.create(createSubsidiaryCategoryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SubsidiaryCategoriesOutput, { name: 'subsidiaryCategories' })
  subsidiaryCategories(
    @Args('subsidiaryCategoriesInput')
    subsidiaryCategoriesInput: SubsidiaryCategoriesInput,
  ) {
    return this.subsidiaryCategoryService.findMany(subsidiaryCategoriesInput);
  }

  @LogData({ description: '부자재 분류업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => SubsidiaryCategory)
  updateSubsidiaryCategory(
    @Args('updateSubsidiaryCategoryInput')
    updateSubsidiaryCategoryInput: UpdateSubsidiaryCategoryInput,
  ) {
    return this.subsidiaryCategoryService.update(updateSubsidiaryCategoryInput);
  }

  @LogData({ description: '부자재 분류삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => SubsidiaryCategory)
  removeSubsidiaryCategory(@Args('_id') _id: string) {
    return this.subsidiaryCategoryService.remove(_id);
  }
}
