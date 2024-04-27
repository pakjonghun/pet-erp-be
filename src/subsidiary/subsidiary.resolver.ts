import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SubsidiaryService } from './subsidiary.service';
import { Subsidiary } from './entities/subsidiary.entity';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { SubsidiariesInput } from './dto/subsidiaries.input';
import { SubsidiariesOutput } from './dto/subsidiaries.output';

@Resolver(() => Subsidiary)
export class SubsidiaryResolver {
  constructor(private readonly subsidiaryService: SubsidiaryService) {}

  @Mutation(() => Subsidiary)
  createSubsidiary(
    @Args('createSubsidiaryInput') createSubsidiaryInput: CreateSubsidiaryInput,
  ) {
    return this.subsidiaryService.create(createSubsidiaryInput);
  }

  @Query(() => SubsidiariesOutput, { name: 'subsidiaries' })
  async subsidiaries(
    @Args('subsidiariesInput') subsidiariesInput: SubsidiariesInput,
  ) {
    const result = await this.subsidiaryService.findMany(subsidiariesInput);
    return result;
  }

  @Mutation(() => Subsidiary)
  updateSubsidiary(
    @Args('updateSubsidiaryInput') updateSubsidiaryInput: UpdateSubsidiaryInput,
  ) {
    return this.subsidiaryService.update(updateSubsidiaryInput);
  }

  @Mutation(() => Subsidiary)
  removeSubsidiary(@Args('_id') _id: string) {
    return this.subsidiaryService.remove(_id);
  }
}
