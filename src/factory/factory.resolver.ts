import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { FactoryService } from './factory.service';
import { Factory } from './entities/factory.entity';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoriesInput } from './dto/factories.input';
import { FactoriesOutput } from './dto/factories.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';

@Resolver(() => Factory)
export class FactoryResolver {
  constructor(private readonly factoryService: FactoryService) {}

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Factory)
  createFactory(
    @Args('createFactoryInput') createFactoryInput: CreateFactoryInput,
  ) {
    return this.factoryService.create(createFactoryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => FactoriesOutput, { name: 'factories' })
  async factories(@Args('factoriesInput') factoriesInput: FactoriesInput) {
    const result = await this.factoryService.findMany(factoriesInput);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Factory)
  updateFactory(
    @Args('updateFactoryInput') updateFactoryInput: UpdateFactoryInput,
  ) {
    return this.factoryService.update(updateFactoryInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Factory)
  removeFactory(@Args('_id', { type: () => String }) _id: string) {
    return this.factoryService.remove(_id);
  }
}
