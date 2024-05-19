import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubsidiaryService } from './subsidiary.service';
import { Subsidiary } from './entities/subsidiary.entity';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { SubsidiariesInput } from './dto/subsidiaries.input';
import { SubsidiariesOutput } from './dto/subsidiaries.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';

@Resolver(() => Subsidiary)
export class SubsidiaryResolver {
  constructor(private readonly subsidiaryService: SubsidiaryService) {}

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Subsidiary)
  createSubsidiary(
    @Args('createSubsidiaryInput') createSubsidiaryInput: CreateSubsidiaryInput,
  ) {
    return this.subsidiaryService.create(createSubsidiaryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SubsidiariesOutput, { name: 'subsidiaries' })
  async subsidiaries(
    @Args('subsidiariesInput') subsidiariesInput: SubsidiariesInput,
  ) {
    const result = await this.subsidiaryService.findMany(subsidiariesInput);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Subsidiary)
  updateSubsidiary(
    @Args('updateSubsidiaryInput') updateSubsidiaryInput: UpdateSubsidiaryInput,
  ) {
    return this.subsidiaryService.update(updateSubsidiaryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Subsidiary)
  removeSubsidiary(@Args('_id') _id: string) {
    return this.subsidiaryService.remove(_id);
  }
}
