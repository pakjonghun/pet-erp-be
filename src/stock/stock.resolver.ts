import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StockService } from './stock.service';
import { Stock } from './entities/stock.entity';
import { CreateStockInput } from './dto/create-stock.input';
import { UpdateStockInput } from './dto/update-stock.input';
import { TotalProductStockOutput } from './dto/total-product-stock.output';

@Resolver(() => Stock)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}
  @Mutation(() => [Stock])
  addStock(@Args('addStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.add(addStocksInput);
  }

  @Mutation(() => [Stock])
  outStock(@Args('outStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.out(addStocksInput);
  }

  // @Mutation(() => Stock)
  // createStock(@Args('createStockInput') createStockInput: CreateStockInput) {
  //   return this.stockService.create(createStockInput);
  // }

  @Query(() => [TotalProductStockOutput], { name: 'stock' })
  findAll() {
    return this.stockService.findAll();
  }

  @Query(() => Stock, { name: 'stock' })
  findOne(@Args('_id', { type: () => String }) _id: string) {
    return this.stockService.findOne({});
  }

  @Mutation(() => Stock)
  updateStock(@Args('updateStockInput') updateStockInput: UpdateStockInput) {
    return this.stockService.update(updateStockInput.id, updateStockInput);
  }

  @Mutation(() => Stock)
  removeStock(@Args('id', { type: () => Int }) id: number) {
    return this.stockService.remove(id);
  }
}
