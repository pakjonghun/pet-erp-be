import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StockService } from './stock.service';
import { Stock } from './entities/stock.entity';
import { CreateStockInput } from './dto/create-stock.input';
import { TotalProductStockOutput } from './dto/total-product-stock.output';
import { StocksInput } from './dto/stocks.input';
import { StocksOutput } from './dto/stocks.output';
import { StockStateOutput } from './dto/stocks-state.output';

@Resolver(() => Stock)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}
  @Mutation(() => [Stock], { nullable: true })
  addStock(@Args('addStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.add(addStocksInput);
  }

  @Mutation(() => [Stock])
  outStock(@Args('outStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.out(addStocksInput);
  }

  @Query(() => StocksOutput)
  stocks(@Args('stocksInput') stockInput: StocksInput) {
    return this.stockService.findMany(stockInput);
  }

  @Query(() => [StockStateOutput])
  async stocksState(@Args('productName') productName: string) {
    const result = await this.stockService.findStockByState(productName);
    return result;
  }

  @Query(() => [TotalProductStockOutput], { name: 'stock' })
  findAll() {
    // return this.stockService.findAll();
    return;
  }
}
