import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { FactoryService } from './factory.service';
import { Factory } from './entities/factory.entity';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoriesInput } from './dto/factories.input';
import { FactoriesOutput } from './dto/factories.output';

@Resolver(() => Factory)
export class FactoryResolver {
  constructor(private readonly factoryService: FactoryService) {}

  @Mutation(() => Factory)
  createFactory(
    @Args('createFactoryInput') createFactoryInput: CreateFactoryInput,
  ) {
    return this.factoryService.create(createFactoryInput);
  }

  @Query(() => FactoriesOutput, { name: 'factories' })
  async factories(@Args('factoriesInput') factoriesInput: FactoriesInput) {
    const result = await this.factoryService.findMany(factoriesInput);
    return result;
  }

  @Mutation(() => Factory)
  updateFactory(
    @Args('updateFactoryInput') updateFactoryInput: UpdateFactoryInput,
  ) {
    return this.factoryService.update(updateFactoryInput);
  }

  @Mutation(() => Factory)
  removeFactory(@Args('_id', { type: () => String }) _id: string) {
    return this.factoryService.remove(_id);
  }
}
