import {
  Resolver,
  Mutation,
  Args,
  Query,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { ProductOrderService } from './product-order.service';
import { OrderProduct, ProductOrder } from './entities/product-order.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { ProductOrderOutput } from './dto/orders.output';
import { OrdersInput } from './dto/orders.input';
import { Factory } from 'src/factory/entities/factory.entity';
import DataLoader from 'dataloader';
import { FactoryLoader } from 'src/factory/factory.loader';
import { Product } from 'src/product/entities/product.entity';
import { InternalServerErrorException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';

@Resolver(() => ProductOrder)
export class ProductOrderResolver {
  constructor(private readonly orderService: ProductOrderService) {}

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Mutation(() => ProductOrder)
  createOrder(@Args('createOrderInput') createOrderInput: CreateOrderInput) {
    return this.orderService.create(createOrderInput);
  }

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Mutation(() => ProductOrder)
  updateOrder(@Args('updateOrderInput') updateOrderInput: UpdateOrderInput) {
    return this.orderService.update(updateOrderInput);
  }

  @Roles([AuthRoleEnum.ADMIN, AuthRoleEnum.MANAGER])
  @Mutation(() => ProductOrder)
  removeOrder(@Args('_id', { type: () => String }) _id: string) {
    return this.orderService.remove(_id);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => ProductOrderOutput)
  async orders(@Args('ordersInput') ordersInput: OrdersInput) {
    return this.orderService.findMany(ordersInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => [ProductOrder])
  async stocksOrder(@Args('productName') productName: string) {
    const result = await this.orderService.findStocksOrder(productName);
    return result;
  }

  @ResolveField(() => Factory)
  async factory(
    @Parent() order: ProductOrder,
    @Context('loaders')
    { factoryLoader }: { factoryLoader: DataLoader<string, FactoryLoader> },
  ) {
    if (order.factory.name) {
      return order.factory;
    }

    const factoryId = (
      order.factory as unknown as Types.ObjectId
    ).toHexString();
    return factoryLoader.load(factoryId);
  }

  @ResolveField(() => OrderProduct)
  async products(
    @Parent() order: ProductOrder,
    @Context('loaders')
    { productLoader }: { productLoader: DataLoader<string, Product> },
  ) {
    if (order.products.some((item) => item.product.name)) {
      return order.products;
    }

    const productIds = order.products.map((item) =>
      (item.product as unknown as ObjectId).toHexString(),
    );
    const products = (await productLoader.loadMany(productIds)) as Product[];
    if (products.some((item) => item instanceof Error)) {
      throw new InternalServerErrorException(
        '제품 리스트를 검색하는 도중에 오류가 발생했습니다.',
      );
    }

    return order.products.map((item) => ({
      count: item.count,
      product: products.find(
        (product) =>
          product._id.toHexString() === item.product._id.toHexString(),
      ),
    }));
  }
}
