import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliveryCost } from './entities/delivery.entity';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { SaleService } from './sale.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { SabandService } from './sabang.service';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { SaleOutOutput } from './dto/sale-out.output';
import { SaleOutCheck } from './entities/sale.out.check.entity';
import * as dayjs from 'dayjs';

@Resolver(() => DeliveryCost)
export class SaleResolver {
  constructor(
    private readonly saleService: SaleService,
    private readonly sabangService: SabandService,
  ) {}

  @LogData({ description: '택배 비용수정', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.ADMIN_DELIVERY])
  @Mutation(() => DeliveryCost)
  setDeliveryCost(
    @Args('setDeliveryCostInput') setDeliveryCostInput: SetDeliveryCostInput,
  ) {
    return this.saleService.setDeliveryCost(setDeliveryCostInput);
  }

  @Roles([AuthRoleEnum.ADMIN_DELIVERY])
  @Query(() => DeliveryCost, { nullable: true })
  async deliveryCost() {
    const result = await this.saleService.deliveryCost();
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => DeliveryCost, { nullable: true })
  async loadSabangData() {
    await this.sabangService.run();
  }

  @Roles([AuthRoleEnum.STOCK_SALE_OUT])
  @Mutation(() => SaleOutOutput, { nullable: true })
  async outSaleData(@Context() ctx: any) {
    const userId = ctx.req.user.id;

    const targetTime = dayjs().utc().set('hour', 11).set('minute', 30);
    const nowTime = targetTime.get('hour');
    console.log('targetTime : ', nowTime);
    const now = dayjs();
    console.log('nowTime : ', now.get('hour'));

    const isShouldCheckTime = now.isAfter(now);
    console.log('isShouldCheckTime : ', isShouldCheckTime);
    if (isShouldCheckTime) {
    }
    const result = await this.sabangService.out(userId);

    await this.saleService.setCheckSaleOut(true);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SaleOutCheck, { nullable: true })
  async saleOutCheck() {
    const result = await this.saleService.saleOutCheck();
    return result;
  }
}
