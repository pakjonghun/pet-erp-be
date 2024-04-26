import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { SubsidiaryService } from './subsidiary.service';
import { Subsidiary } from './entities/subsidiary.entity';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { SubsidiariesInput } from './dto/subsidiaries.input';

@Resolver(() => Subsidiary)
export class SubsidiaryResolver {
  constructor(private readonly subsidiaryService: SubsidiaryService) {}

  @Mutation(() => Subsidiary)
  createSubsidiary(
    @Args('createSubsidiaryInput') createSubsidiaryInput: CreateSubsidiaryInput,
  ) {
    return this.subsidiaryService.create(createSubsidiaryInput);
  }

  @Query(() => [Subsidiary], { name: 'subsidiaries' })
  subsidiaries(
    @Args('subsidiariesInput') subsidiariesInput: SubsidiariesInput,
  ) {
    return this.subsidiaryService.findMany(subsidiariesInput);
  }

  @Query(() => Subsidiary, { name: 'subsidiary' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.subsidiaryService.findOne(id);
  }

  @Mutation(() => Subsidiary)
  updateSubsidiary(
    @Args('updateSubsidiaryInput') updateSubsidiaryInput: UpdateSubsidiaryInput,
  ) {
    return this.subsidiaryService.update(
      updateSubsidiaryInput._id,
      updateSubsidiaryInput,
    );
  }

  @Mutation(() => Subsidiary)
  removeSubsidiary(@Args('id', { type: () => Int }) id: number) {
    return this.subsidiaryService.remove(id);
  }
}
