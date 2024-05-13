import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ProductOrderService } from './product-order.service';
import { ProductOrder } from './entities/product-order.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';
import { OrdersInput } from './dto/orders.input';

@Resolver(() => ProductOrder)
export class ProductOrderResolver {
  constructor(private readonly orderService: ProductOrderService) {}

  @Mutation(() => ProductOrder)
  createOrder(@Args('createOrderInput') createOrderInput: CreateOrderInput) {
    return this.orderService.create(createOrderInput);
  }

  @Query(() => [ProductOrder])
  findAll(@Args('ordersInput') ordersInput: OrdersInput) {
    return this.orderService.findMany(ordersInput);
  }

  @Mutation(() => ProductOrder)
  updateOrder(@Args('updateOrderInput') updateOrderInput: UpdateOrderInput) {
    return this.orderService.update(updateOrderInput);
  }

  @Mutation(() => ProductOrder)
  removeOrder(@Args('id', { type: () => String }) id: string) {
    return this.orderService.remove(id);
  }
}
