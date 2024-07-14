import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { FactoryService } from './factory.service';
import { Factory } from './entities/factory.entity';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoriesInput } from './dto/factories.input';
import { FactoriesOutput } from './dto/factories.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import DataLoader from 'dataloader';
import { Product } from 'src/product/entities/product.entity';
import { InternalServerErrorException } from '@nestjs/common';

@Resolver(() => Factory)
export class FactoryResolver {
  constructor(private readonly factoryService: FactoryService) {}

  @LogData({ description: '공장생성', logType: LogTypeEnum.CREATE })
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

  @LogData({ description: '공장업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => Factory)
  updateFactory(
    @Args('updateFactoryInput') updateFactoryInput: UpdateFactoryInput,
  ) {
    return this.factoryService.update(updateFactoryInput);
  }

  @LogData({ description: '공장삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => Factory)
  removeFactory(@Args('_id', { type: () => String }) _id: string) {
    return this.factoryService.remove(_id);
  }

  @ResolveField(() => [String])
  async productList(
    @Parent() factory: Factory,
    @Context('loaders')
    { productLoader }: { productLoader: DataLoader<string, Product> },
  ) {
    const productIds = factory.productList;
    if (!productIds) return [];

    const products = (await productLoader.loadMany(productIds)) as Product[];
    if (products.some((item) => item instanceof Error)) {
      throw new InternalServerErrorException(
        '제품 리스트를 검색하는 도중에 오류가 발생했습니다.',
      );
    }

    const productByName = new Map<string, Product>(
      products.map((product) => [product._id.toHexString(), product]),
    );

    return factory.productList.map((item) => productByName.get(item).name);
  }
}
