import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { WholeSaleService } from './whole-sale.service';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { WholeSaleOutput } from './dto/whole-sales.output';

@Resolver(() => Sale)
export class WholeSaleResolver {
  constructor(private readonly wholeSaleService: WholeSaleService) {}

  @Mutation(() => Sale)
  createWholeSale(
    @Args('createWholeSaleInput') createWholeSaleInput: CreateWholeSaleInput,
  ) {
    return this.wholeSaleService.create(createWholeSaleInput);
  }

  @Query(() => [Sale], { name: 'wholeSale' })
  findAll() {
    return this.wholeSaleService.findAll();
  }

  @Query(() => Sale, { name: 'wholeSale' })
  findOne(@Args('_id') _id: string) {
    return this.wholeSaleService.findOne(_id);
  }

  @Mutation(() => WholeSaleOutput)
  updateWholeSale(
    @Args('updateWholeSaleInput') updateWholeSaleInput: UpdateWholeSaleInput,
  ) {
    return this.wholeSaleService.update(updateWholeSaleInput);
  }

  @Mutation(() => Sale)
  removeWholeSale(@Args('id', { type: () => Int }) id: number) {
    return this.wholeSaleService.remove(id);
  }
}
