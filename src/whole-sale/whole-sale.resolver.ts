import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
  Context,
} from '@nestjs/graphql';
import { WholeSaleService } from './whole-sale.service';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleItem, WholeSaleOutput } from './dto/whole-sales.output';
import { WholeSalesInput } from './dto/whole-sales.input';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';

@Resolver(() => WholeSaleItem)
export class WholeSaleResolver {
  constructor(private readonly wholeSaleService: WholeSaleService) {}

  @Roles([AuthRoleEnum.ANY])
  @Query(() => WholeSaleOutput)
  async wholeSales(@Args('wholeSalesInput') wholeSalesInput: WholeSalesInput) {
    const result = await this.wholeSaleService.findAll(wholeSalesInput);
    return result;
  }

  @LogData({ description: '도매판매 업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.SALE_EDIT])
  @Mutation(() => [WholeSaleItem], { nullable: true })
  async updateWholeSale(
    @Args('updateWholeSaleInput') updateWholeSaleInput: UpdateWholeSaleInput,
    @Context() ctx: any,
  ) {
    const userId = ctx.req.user.id;
    const result = await this.wholeSaleService.update(
      updateWholeSaleInput,
      userId,
    );
    return result;
  }

  @LogData({ description: '도매판매생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.SALE_CREATE])
  @Mutation(() => [Sale], { nullable: true })
  createWholeSale(
    @Args('createWholeSaleInput') createWholeSaleInput: CreateWholeSaleInput,
  ) {
    return this.wholeSaleService.create(createWholeSaleInput);
  }

  @LogData({ description: '도매판매삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.SALE_DELETE])
  @Mutation(() => WholeSaleItem, { nullable: true })
  async removeWholeSale(
    @Args('_id', { type: () => String }) _id: string,
    @Context() ctx: any,
  ) {
    const userId = ctx.req.user.id;
    await this.wholeSaleService.removeAllWholeSaleById(_id, userId);
    return { _id };
  }

  @ResolveField(() => Int)
  totalWonCost(@Parent() parent: WholeSaleItem) {
    return parent.productList.reduce((acc, cur) => acc + (cur.wonCost ?? 0), 0);
  }

  @ResolveField(() => Int)
  totalCount(@Parent() parent: WholeSaleItem) {
    return parent.productList.reduce((acc, cur) => acc + cur.count, 0);
  }

  @ResolveField(() => Int)
  totalPayCost(@Parent() parent: WholeSaleItem) {
    return parent.productList.reduce((acc, cur) => acc + cur.payCost, 0);
  }
}
