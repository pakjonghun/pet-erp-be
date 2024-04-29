import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dtos/create-product.input';
import { UpdateProductInput } from './dtos/update-product.input';
import { ProductSaleInput } from './dtos/product-sale.input';
import { ProductSaleChartOutput } from './dtos/product-sale-chart.output';
import { ProductsInput } from './dtos/products-input';
import { ProductsOutput } from './dtos/products.output';
import { ProductSaleOutput, SaleInfo } from './dtos/product-sale.output';
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
  async findMany(@Args('productsInput') productsInput: ProductsInput) {
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

  @Query(() => SaleInfo, { nullable: true })
  async dashboardProduct(
    @Args('dashboardProductInput', { nullable: true })
    dashboardProductInput: FindDateInput,
  ) {
    const result = await this.productService.totalSaleBy(dashboardProductInput);
    return result[0];
  }

  @Query(() => [SaleInfo], { nullable: true })
  async dashboardProducts(
    @Args('dashboardProductsInput', { nullable: true })
    dashboardProductInputs: FindDateInput,
  ) {
    const result = await this.productService.totalSaleBy(
      dashboardProductInputs,
      'productCode',
    );
    return result;
  }
}
