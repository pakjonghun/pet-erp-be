import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import { ClientsOutput } from './dtos/clients.output';
import { ClientsInput } from './dtos/clients.input';
import {
  DashboardResult,
  TotalSaleInfo,
} from 'src/product/dtos/product-sale.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { FindDateScrollInput } from 'src/common/dtos/find-date-scroll.input';
import { ClientSaleMenuOutput } from './dtos/client-sale-menu.output';

@Resolver(() => Client)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @LogData({ description: '거래처생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Client)
  createClient(
    @Args('createClientInput') createClientInput: CreateClientInput,
  ) {
    return this.clientService.create(createClientInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [Client], { name: 'client' })
  findAll() {
    return this.clientService.findAll();
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ClientsOutput)
  clients(@Args('clientsInput') clientsInput: ClientsInput) {
    return this.clientService.findMany(clientsInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => Client, { name: 'client' })
  findOne(@Args('_id') _id: string) {
    return this.clientService.findOne(_id);
  }

  @LogData({ description: '거래처업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => Client)
  updateClient(
    @Args('updateClientInput') updateClientInput: UpdateClientInput,
  ) {
    return this.clientService.update(updateClientInput);
  }

  @LogData({ description: '거래처삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => Client)
  async removeClient(@Args('_id') _id: string) {
    const result = await this.clientService.remove(_id);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => TotalSaleInfo, { nullable: true })
  async dashboardClient(
    @Args('dashboardClientInput', { nullable: true })
    dashboardClientInput: FindDateInput,
  ) {
    const { current, previous } =
      await this.clientService.totalSaleBy(dashboardClientInput);
    return { current: current.data[0], previous: previous.data[0] };
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => DashboardResult, { nullable: true })
  async dashboardClients(
    @Args('dashboardClientsInput', { nullable: true })
    dashboardClientsInput: FindDateInput,
  ) {
    const { current, previous } = await this.clientService.totalSaleBy(
      dashboardClientsInput,
      'mallId',
    );

    const data = current.data.map((item) => {
      const previousItem = previous.data.find((prev) => prev._id === item._id);
      return {
        ...item,
        prevAccPayCost: previousItem?.accPayCost,
        prevAccCount: previousItem?.accCount,
        prevAccProfit: previousItem?.accProfit,
        prevAveragePayCost: previousItem?.averagePayCost,
      };
    });
    return {
      data,
      totalCount: current.totalCount,
    };
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ClientSaleMenuOutput)
  async saleMenuClients(
    @Args('saleMenuClientsInput', { nullable: true })
    saleMenuClientsInput: FindDateScrollInput,
  ) {
    return this.clientService.clientSaleMenu(saleMenuClientsInput);
  }
}
