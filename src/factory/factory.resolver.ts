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
  findAll() {
    return this.factoryService.findAll();
  }

  @Query(() => Factory, { name: 'factory' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.factoryService.findOne(id);
  }

  @Mutation(() => Factory)
  updateFactory(
    @Args('updateFactoryInput') updateFactoryInput: UpdateFactoryInput,
  ) {
    return this.factoryService.update(
      updateFactoryInput.id,
      updateFactoryInput,
    );
  }

  @Mutation(() => Factory)
  removeFactory(@Args('id', { type: () => Int }) id: number) {
    return this.factoryService.remove(id);
  }
}
