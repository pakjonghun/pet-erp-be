import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dtos/create-product.input';
import { UpdateProductInput } from './dtos/update-product.input';
import { ProductSaleInput } from './dtos/product-sale.input';
import { ProductSaleChartOutput } from './dtos/product-sale-chart.output';
import { ProductsInput } from './dtos/products-input';
import { ProductsOutput } from './dtos/products.output';
import {
  ProductSaleOutput,
  SaleInfos,
  TotalSaleInfo,
} from './dtos/product-sale.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => Product)
  async createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    const result = await this.productService.create(createProductInput);
    return result;
  }

  @Query(() => ProductsOutput, { name: 'products' })
  async products(@Args('productsInput') productsInput: ProductsInput) {
    console.log('productsInput : ', productsInput);
    const result = await this.productService.findMany(productsInput);
    return result;
  }

  @Query(() => Product, { name: 'product' })
  findOne(@Args('_id', { type: () => String }) _id: string) {
    return this.productService.findOne({ _id });
  }

  @Mutation(() => Product)
  updateProduct(
    @Args('updateProductInput') updateProductInput: UpdateProductInput,
  ) {
    return this.productService.update(updateProductInput);
  }

  @Mutation(() => Product)
  removeProduct(@Args('_id', { type: () => String }) _id: string) {
    return this.productService.remove(_id);
  }

  @Query(() => ProductSaleOutput, { nullable: true })
  async productSales(
    @Args('productSalesInput') productSalesInput: ProductSaleInput,
  ) {
    const result = await this.productService.salesByProduct(productSalesInput);
    return result;
  }

  @Query(() => [ProductSaleChartOutput], { nullable: true })
  async productSale(@Args('productCode') productCode: string) {
    const result = await this.productService.saleProduct(productCode);
    return result;
  }

  @Query(() => TotalSaleInfo, { nullable: true })
  async dashboardProduct(
    @Args('dashboardProductInput', { nullable: true })
    dashboardProductInput: FindDateInput,
  ) {
    const { current, previous } = await this.productService.totalSaleBy(
      dashboardProductInput,
    );
    return { current: current[0], previous: previous[0] };
  }

  @Query(() => [SaleInfos], { nullable: true })
  async dashboardProducts(
    @Args('dashboardProductsInput', { nullable: true })
    dashboardProductInputs: FindDateInput,
  ) {
    const { current, previous } = await this.productService.totalSaleBy(
      dashboardProductInputs,
      'productCode',
    );

    return current.map((item) => {
      const previousItem = previous.find((prev) => prev._id === item._id);
      return {
        ...item,
        prevAccPayCost: previousItem?.accPayCost,
        prevAccCount: previousItem?.accCount,
        prevAccProfit: previousItem?.accProfit,
        prevAveragePayCost: previousItem?.averagePayCost,
      };
    });
  }
}
