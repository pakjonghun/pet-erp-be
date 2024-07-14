import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { ClientService } from './client.service';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import {
  ClientsOutput,
  OutClient,
  ProductCodeName,
} from './dtos/clients.output';
import { ClientsInput } from './dtos/clients.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { InternalServerErrorException } from '@nestjs/common';
import DataLoader from 'dataloader';

@Resolver(() => OutClient)
export class ClientOutResolver {
  constructor(private readonly clientService: ClientService) {}

  @LogData({ description: '거래처생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => OutClient)
  async createClient(
    @Args('createClientInput') createClientInput: CreateClientInput,
  ) {
    const result = await this.clientService.create(createClientInput);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [OutClient], { name: 'client' })
  findAll() {
    return this.clientService.findAll();
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ClientsOutput)
  async clients(@Args('clientsInput') clientsInput: ClientsInput) {
    const clients = await this.clientService.findMany(clientsInput);
    return clients;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => OutClient, { name: 'client' })
  findOne(@Args('_id') _id: string) {
    return this.clientService.findOne(_id);
  }

  @LogData({ description: '거래처업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => OutClient)
  updateClient(
    @Args('updateClientInput') updateClientInput: UpdateClientInput,
  ) {
    return this.clientService.update(updateClientInput);
  }

  @ResolveField(() => [String])
  async deliveryFreeProductCodeList(
    @Parent() client: OutClient,
    @Context('loaders')
    { clientLoader }: { clientLoader: DataLoader<string, ProductCodeName> },
  ) {
    const freeProductCodeList =
      (client.deliveryFreeProductCodeList as unknown as string[]) ?? [];

    if (!freeProductCodeList || freeProductCodeList.length == 0) {
      return [];
    }

    const productCodeNameList = (await clientLoader.loadMany(
      freeProductCodeList,
    )) as ProductCodeName[];

    const error = productCodeNameList.find((item) => item instanceof Error);

    if (error) {
      throw new InternalServerErrorException(
        (error as any)?.message ??
          '제품 이름을 검색하는 도중에 오류가 발생했습니다.!!!',
      );
    }

    return productCodeNameList;
  }

  @ResolveField(() => [String])
  async deliveryNotFreeProductCodeList(
    @Parent() client: OutClient,
    @Context('loaders')
    { clientLoader }: { clientLoader: DataLoader<string, ProductCodeName> },
  ) {
    const notFreeProductCodeList =
      (client.deliveryNotFreeProductCodeList as unknown as string[]) ?? [];

    if (!notFreeProductCodeList || notFreeProductCodeList.length == 0) {
      return [];
    }

    const productCodeNameList = (await clientLoader.loadMany(
      notFreeProductCodeList,
    )) as ProductCodeName[];

    const error = productCodeNameList.find((item) => item instanceof Error);
    if (error) {
      const baseErrorMessage =
        '제품 이름을 검색하는 도중에 오류가 발생했습니다.???';
      throw new InternalServerErrorException(
        (error as any)?.message ?? baseErrorMessage,
      );
    }
    return productCodeNameList;
  }
}
