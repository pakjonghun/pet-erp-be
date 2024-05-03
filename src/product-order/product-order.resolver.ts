import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { OrderService } from './product-order.service';
import { ProductOrder } from './entities/product-order.entity';
import { CreateOrderInput } from './dto/create-order.input';
import { UpdateOrderInput } from './dto/update-order.input';

@Resolver(() => ProductOrder)
export class OrderResolver {
  constructor(private readonly orderService: OrderService) {}

  @Mutation(() => ProductOrder)
  createOrder(@Args('createOrderInput') createOrderInput: CreateOrderInput) {
    return this.orderService.create(createOrderInput);
  }

  @Query(() => [ProductOrder])
  findAll() {
    return this.orderService.findAll();
  }

  @Query(() => ProductOrder)
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.orderService.findOne(id);
  }

  @Mutation(() => ProductOrder)
  updateOrder(@Args('updateOrderInput') updateOrderInput: UpdateOrderInput) {
    return this.orderService.update(updateOrderInput.id, updateOrderInput);
  }

  @Mutation(() => ProductOrder)
  removeOrder(@Args('id', { type: () => Int }) id: number) {
    return this.orderService.remove(id);
  }
}
