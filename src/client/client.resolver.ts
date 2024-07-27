import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ClientService } from './client.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { FindDateScrollInput } from 'src/common/dtos/find-date-scroll.input';
import { ClientSaleMenuOutput } from './dtos/client-sale-menu.output';
import { Client } from './entities/client.entity';

@Resolver(() => Client)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @LogData({ description: '거래처삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => Client)
  async removeClient(@Args('_id') _id: string) {
    const result = await this.clientService.remove(_id);
    return result;
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
