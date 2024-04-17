import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';
import { CreateProductInput } from './dtos/create-product.input';
import { UpdateProductInput } from './dtos/update-product.input';
import { ProductSaleOutput } from './dtos/product-sale.output';
import { ProductSaleInput } from './dtos/product-sale.input';
import { ProductSaleChartOutput } from './dtos/product-sale-chart.output';
import { ProductsInput } from './dtos/products-input';
import { ProductsOutput } from './dtos/products.output';

@Resolver(() => Product)
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @Mutation(() => Product)
  createProduct(
    @Args('createProductInput') createProductInput: CreateProductInput,
  ) {
    return this.productService.create(createProductInput);
  }

  @Query(() => ProductsOutput, { name: 'products' })
  findMany(@Args('productsInput') productsInput: ProductsInput) {
    return this.productService.findMany(productsInput);
  }

  @Query(() => Product, { name: 'product' })
  findOne(@Args('_id', { type: () => String }) _id: string) {
    return this.productService.findOne(_id);
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

  @Query(() => ProductSaleOutput)
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
}
