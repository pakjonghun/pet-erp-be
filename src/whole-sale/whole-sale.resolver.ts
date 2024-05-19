import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Int,
} from '@nestjs/graphql';
import { WholeSaleService } from './whole-sale.service';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleItem, WholeSaleOutput } from './dto/whole-sales.output';
import { WholeSalesInput } from './dto/whole-sales.input';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';

@Resolver(() => WholeSaleItem)
export class WholeSaleResolver {
  constructor(private readonly wholeSaleService: WholeSaleService) {}

  @Query(() => WholeSaleOutput)
  async wholeSales(@Args('wholeSalesInput') wholeSalesInput: WholeSalesInput) {
    const result = await this.wholeSaleService.findAll(wholeSalesInput);
    return result;
  }

  @Mutation(() => [Sale], { nullable: true })
  updateWholeSale(
    @Args('updateWholeSaleInput') updateWholeSaleInput: UpdateWholeSaleInput,
  ) {
    return this.wholeSaleService.update(updateWholeSaleInput);
  }

  @Mutation(() => [Sale], { nullable: true })
  createWholeSale(
    @Args('createWholeSaleInput') createWholeSaleInput: CreateWholeSaleInput,
  ) {
    return this.wholeSaleService.create(createWholeSaleInput);
  }

  @Mutation(() => WholeSaleItem, { nullable: true })
  async removeWholeSale(@Args('_id', { type: () => String }) _id: string) {
    await this.wholeSaleService.removeAllWholeSaleById(_id);
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
