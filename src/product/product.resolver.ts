import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dtos/create-product.input';
import { UpdateProductInput } from './dtos/update-product.input';
import { ProductSaleInput } from './dtos/product-sale.input';
import { ProductSaleChartOutput } from './dtos/product-sale-chart.output';
import { ProductsInput } from './dtos/products-input';
import { ProductsOutput } from './dtos/products.output';
import { DashboardResult, TotalSaleInfo } from './dtos/product-sale.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { ProductSaleMenuOutput } from './dtos/product-sale-menu.output';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @LogData({ description: '제품생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Product)
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    const result = await this.productService.create(createProductInput);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ProductsOutput, { name: 'products' })
  async products(@Args('productsInput') productsInput: ProductsInput) {
    const result = await this.productService.findMany(productsInput);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => Product, { name: 'product' })
  findOne(@Args('_id', { type: () => String }) _id: string) {
    return this.productService.findOne({ _id });
  }

  @LogData({ description: '제품업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => Product)
  updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return this.productService.update(updateProductInput);
  }

  @LogData({ description: '제품삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => Product)
  removeProduct(@Args('_id', { type: () => String }) _id: string) {
    return this.productService.remove(_id);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ProductSaleMenuOutput, { nullable: true })
  async productSales(
    @Args('productSalesInput') productSalesInput: ProductSaleInput,
  ) {
    const result = await this.productService.salesByProduct(productSalesInput);
    console.log('result : ', result);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [ProductSaleChartOutput], { nullable: true })
  async productSale(@Args('productCode') productCode: string) {
    const result = await this.productService.saleProduct(productCode);
    return result;
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => TotalSaleInfo, { nullable: true })
  async dashboardProduct(
    @Args('dashboardProductInput', { nullable: true })
    dashboardProductInput: FindDateInput,
  ) {
    const { current, previous } = await this.productService.totalSaleBy(
      dashboardProductInput,
    );

    return { current: current.data[0], previous: previous.data[0] };
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => DashboardResult, { nullable: true })
  async dashboardProducts(
    @Args('dashboardProductsInput', { nullable: true })
    dashboardProductInputs: FindDateInput,
  ) {
    const { current, previous } = await this.productService.totalSaleBy(
      dashboardProductInputs,
      'productCode',
    );
    const data = current.data.map((item) => {
      const previousItem = previous.data.find((prev) => prev._id === item._id);
      return {
        ...item,
        prevAccDeliveryCost: previousItem?.accDeliveryCost,
        prevAccPayCost: previousItem?.accPayCost,
        prevAccCount: previousItem?.accCount,
        prevAccTotalPayment: previousItem?.accTotalPayment,
      };
    });

    return {
      data,
      totalCount: current.totalCount,
    };
  }
}
