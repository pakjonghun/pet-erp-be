import { Module } from '@nestjs/common';
import { OrderService } from './product-order.service';
import { OrderResolver } from './product-order.resolver';

@Module({
  providers: [OrderResolver, OrderService],
})
export class ProductOrderModule {}
