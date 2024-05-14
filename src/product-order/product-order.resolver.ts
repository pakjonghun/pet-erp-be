import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { ProductOrderService } from './product-order.service';
import { ProductOrder } from './entities/product-order.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrdersInput } from './dto/orders.input';
import { ProductOrderOutput } from './dto/orders.output';
import { Factory } from 'src/factory/entities/factory.entity';
import DataLoader from 'dataloader';
import { FactoryLoader } from 'src/factory/factory.loader';
import { Types } from 'mongoose';

@Resolver(() => ProductOrder)
export class ProductOrderResolver {
  constructor(private readonly orderService: ProductOrderService) {}

  @Mutation(() => ProductOrder)
  createOrder(@Args('createOrderInput') createOrderInput: CreateOrderInput) {
    return this.orderService.create(createOrderInput);
  }

  @Query(() => ProductOrderOutput)
  async orders(@Args('ordersInput') ordersInput: OrdersInput) {
    const result = await this.orderService.findMany(ordersInput);
    console.log(result);
    return result;
  }

  @Mutation(() => ProductOrder)
  updateOrder(@Args('updateOrderInput') updateOrderInput: UpdateOrderInput) {
    return this.orderService.update(updateOrderInput);
  }

  @Mutation(() => ProductOrder)
  removeOrder(@Args('_id', { type: () => String }) _id: string) {
    return this.orderService.remove(_id);
  }
  //
  @ResolveField(() => Factory)
  async factory(
    @Parent() order: ProductOrder,
    @Context('factoryLoader') factoryLoader: DataLoader<string, FactoryLoader>,
  ) {
    const factoryId = (
      order.factory as unknown as Types.ObjectId
    ).toHexString();

    return factoryLoader.load(factoryId);
  }
}
