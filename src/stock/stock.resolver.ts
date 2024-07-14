import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
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
import { SubsidiaryStocksOutput } from './dto/stocks-subsidiary.output';
import { SubsidiaryStockStateOutput } from './dto/stocks-subsidiary-state.output';
import { SubsidiaryCountStocksOutput } from './dto/subsidiary-count-stock.output';

@Resolver(() => Stock)
export class StockResolver {
  constructor(private readonly stockService: StockService) {}

  // @LogData({ description: '입고', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.STOCK_IN])
  @Mutation(() => [Stock], { nullable: true })
  addStock(
    @Args('addStocksInput') addStocksInput: CreateStockInput,
    @Context() ctx: any,
  ) {
    const userId = ctx.req.user.id;
    return this.stockService.addWithSession(addStocksInput, userId);
  }

  // @LogData({ description: '출고', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.STOCK_OUT])
  @Mutation(() => [Stock], { nullable: true })
  async outStock(
    @Args('outStocksInput') addStocksInput: CreateStockInput,
    @Context() ctx: any,
  ) {
    const userId = ctx.req.user.id as string;
    const result = await this.stockService.outWithSession({
      createStockInput: addStocksInput,
      userId,
    });

    return result;
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
  @Query(() => SubsidiaryCountStocksOutput, { nullable: true })
  subsidiaryCountStocks(
    @Args('productCountStocksInput')
    productCountStockInput: ProductCountStocksInput,
  ) {
    return this.stockService.subsidiaryCountStocks(productCountStockInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [StockStateOutput])
  async stocksState(@Args('productName') productName: string) {
    const result = await this.stockService.findStockByState(productName);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [SubsidiaryStockStateOutput])
  async subsidiaryStocksState(@Args('productName') productName: string) {
    const result =
      await this.stockService.findSubsidiaryStockByState(productName);

    return result;
  }
}
//
