import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { DeliveryCost } from './entities/delivery.entity';
import { DeliveryCostInput } from './dto/delivery-cost.Input';
import { SaleService } from './sale.service';

@Resolver(() => DeliveryCost)
export class SaleResolver {
  constructor(private readonly saleService: SaleService) {}

  @Mutation(() => DeliveryCost)
  setDeliveryCost(
    @Args('deliveryCostInput') deliveryCostInput: DeliveryCostInput,
  ) {
    return this.saleService.setDeliveryCost(deliveryCostInput);
  }

  @Query(() => Int, { nullable: true })
  deliveryCost() {
    return this.saleService.deliveryCost();
  }
}
