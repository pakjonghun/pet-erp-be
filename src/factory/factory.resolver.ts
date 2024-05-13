import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { FactoryService } from './factory.service';
import { Factory } from './entities/factory.entity';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';

@Resolver(() => Factory)
export class FactoryResolver {
  constructor(private readonly factoryService: FactoryService) {}

  @Mutation(() => Factory)
  createFactory(
    @Args('createFactoryInput') createFactoryInput: CreateFactoryInput,
  ) {
    return this.factoryService.create(createFactoryInput);
  }

  @Query(() => [Factory], { name: 'factories' })
  factories(@Args('factoryName', { type: () => String }) factoryName: string) {
    return this.factoryService.findAll(factoryName);
  }

  @Mutation(() => Factory)
  updateFactory(
    @Args('updateFactoryInput') updateFactoryInput: UpdateFactoryInput,
  ) {
    return this.factoryService.update(updateFactoryInput);
  }

  @Mutation(() => Factory)
  removeFactory(@Args('id', { type: () => String }) id: string) {
    return this.factoryService.remove(id);
  }
}
