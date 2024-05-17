import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { WholeSaleService } from './whole-sale.service';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleOutput } from './dto/whole-sales.output';
import { WholeSalesInput } from './dto/whole-sales.input';

@Resolver(() => Sale)
export class WholeSaleResolver {
  constructor(private readonly wholeSaleService: WholeSaleService) {}

  @Mutation(() => Sale, { nullable: true })
  createWholeSale(
    @Args('createWholeSaleInput') createWholeSaleInput: CreateWholeSaleInput,
  ) {
    return this.wholeSaleService.create(createWholeSaleInput);
  }

  @Query(() => [Sale])
  wholeSales(@Args('wholeSalesInput') wholeSalesInput: WholeSalesInput) {
    return this.wholeSaleService.findAll(wholeSalesInput);
  }

  @Mutation(() => WholeSaleOutput)
  updateWholeSale(
    @Args('updateWholeSaleInput') updateWholeSaleInput: UpdateWholeSaleInput,
  ) {
    return this.wholeSaleService.update(updateWholeSaleInput);
  }

  @Mutation(() => Sale)
  removeWholeSale(
    @Args('wholeSaleId', { type: () => String }) wholeSaleId: string,
  ) {
    return this.wholeSaleService.remove(wholeSaleId);
  }
}
