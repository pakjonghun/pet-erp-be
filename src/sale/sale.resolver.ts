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
import { Sale } from './entities/sale.entity';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { TotalSaleInfo } from './dto/sale.output';
import * as dayjs from 'dayjs';

@Resolver(() => DeliveryCost)
export class SaleResolver {
  constructor(
    private readonly saleService: SaleService,
    private readonly sabangService: SabandService,
  ) {}

  @Roles([AuthRoleEnum.ANY])
  @Query(() => TotalSaleInfo, { nullable: true })
  async totalSale(
    @Args('totalSaleInput', { nullable: true })
    totalSaleInput: FindDateInput,
  ) {
    const { current, previous } =
      await this.saleService.totalSaleBy(totalSaleInput);

    return { current: current, previous: previous };
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => TotalSaleInfo, { nullable: true })
  async saleDetail(
    @Args('totalSaleInput', { nullable: true })
    totalSaleInput: FindDateInput,
  ) {
    const { current, previous } =
      await this.saleService.totalSaleBy(totalSaleInput);
    return { current: current.data[0], previous: previous.data[0] };
  }

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
  @Mutation(() => [Sale], { nullable: true })
  async loadSabangData() {
    const result = await this.sabangService.run();
    return result;
  }

  @Roles([AuthRoleEnum.STOCK_SALE_OUT])
  @Mutation(() => SaleOutOutput, { nullable: true })
  async outSaleData(@Context() ctx: any) {
    const userId = ctx.req.user.id;
    const result = await this.sabangService.out(userId);

    const targetTime = dayjs().utc().set('hour', 9).set('minute', 30);
    const now = dayjs();
    const isShouldCheckTime = now.isAfter(targetTime);

    if (isShouldCheckTime) {
      await this.saleService.setCheckSaleOut(true);
    }

    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SaleOutCheck, { nullable: true })
  async saleOutCheck() {
    const result = await this.saleService.saleOutCheck();
    return result;
  }
}
