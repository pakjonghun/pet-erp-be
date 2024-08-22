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
import { SaleOrdersOutput } from './dto/orders.output';
import { SaleOrdersInput } from './dto/orders.input';
import { SaleInfo } from './dto/sale.output';
import { CommonSaleByMallOutput } from './dto/common-sale.output';
import { CommonSaleByMallInput } from './dto/common-sale.input';
import * as dayjs from 'dayjs';
import { CommonSaleMonthAgoInput } from './dto/common-sale-month-ago.input';
import { CommonSaleByMallMonthAgoOutput } from './dto/common-sale-month-ago.output';

@Resolver(() => DeliveryCost)
export class SaleResolver {
  constructor(
    private readonly saleService: SaleService,
    private readonly sabangService: SabandService,
  ) {}

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SaleOrdersOutput)
  async saleOrders(
    @Args('saleOrdersInput', { nullable: true })
    saleOrdersInput: SaleOrdersInput,
  ) {
    return this.saleService.orders(saleOrdersInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SaleInfo, { nullable: true })
  async totalSale(
    @Args('totalSaleInput', { nullable: true })
    totalSaleInput: FindDateInput,
  ) {
    const result = await this.saleService.totalSaleBy(totalSaleInput);

    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [CommonSaleByMallOutput], { nullable: true })
  async commonSaleByMall(
    @Args('commonSaleByMallInput', { nullable: true })
    commonSaleByMallInput: CommonSaleByMallInput,
  ) {
    const result = await this.saleService.commonSaleByMall(
      commonSaleByMallInput,
    );
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => CommonSaleByMallMonthAgoOutput, { nullable: true })
  async commonSaleMonthAgoByMall(
    @Args('commonSaleMonthAgoInput')
    commonSaleMonthAgoInput: CommonSaleMonthAgoInput,
  ) {
    const result = await this.saleService.commonMonthSaleByMall(
      commonSaleMonthAgoInput,
    );
    return result;
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
    await this.saleService.saveProductRate();
    await this.saleService.saveClientProductRate();
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
