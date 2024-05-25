import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliveryCost } from './entities/delivery.entity';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { SaleService } from './sale.service';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { SabandService } from './sabang.service';

@Resolver(() => DeliveryCost)
export class SaleResolver {
  constructor(
    private readonly saleService: SaleService,
    private readonly sabangService: SabandService,
  ) {}

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Mutation(() => DeliveryCost)
  setDeliveryCost(
    @Args('setDeliveryCostInput') setDeliveryCostInput: SetDeliveryCostInput,
  ) {
    return this.saleService.setDeliveryCost(setDeliveryCostInput);
  }

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
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
}
