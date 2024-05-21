import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StockService } from './stock.service';
import { Stock } from './entities/stock.entity';
import { CreateStockInput } from './dto/create-stock.input';
import { StocksInput } from './dto/stocks.input';
import { StocksOutput } from './dto/stocks.output';
import { StockStateOutput } from './dto/stocks-state.output';
import { ProductCountStocksInput } from './dto/product-count-stock.input';
import { ProductCountStocksOutput } from './dto/product-count-stock.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { SubsidiaryStocksOutput } from './dto/stocks-subsidiary.output';

@Resolver(() => Stock)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}

  @LogData({ description: '입고', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => [Stock], { nullable: true })
  addStock(@Args('addStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.add(addStocksInput);
  }

  @LogData({ description: '출고', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => [Stock], { nullable: true })
  outStock(@Args('outStocksInput') addStocksInput: CreateStockInput) {
    return this.stockService.out(addStocksInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => StocksOutput)
  stocks(@Args('stocksInput') stockInput: StocksInput) {
    return this.stockService.findMany(stockInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => SubsidiaryStocksOutput)
  subsidiaryStocks(@Args('stocksInput') stockInput: StocksInput) {
    return this.stockService.subsidiaryFindMany(stockInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ProductCountStocksOutput, { nullable: true })
  productCountStocks(
    @Args('productCountStocksInput')
    productCountStockInput: ProductCountStocksInput,
  ) {
    return this.stockService.productCountStocks(productCountStockInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [StockStateOutput])
  async stocksState(@Args('productName') productName: string) {
    const result = await this.stockService.findStockByState(productName);
    return result;
  }
}
