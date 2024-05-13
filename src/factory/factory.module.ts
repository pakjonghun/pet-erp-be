import { Module, forwardRef } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryResolver } from './factory.resolver';
import { FactoryRepository } from './factory.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { Factory, FactorySchema } from './entities/factory.entity';
import {
  ProductOrder,
  ProductOrderSchema,
} from 'src/product-order/entities/product-order.entity';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    forwardRef(() => AppModule),
    DatabaseModule.forFeature([
      {
        name: Factory.name,
        schema: FactorySchema,
      },
      {
        name: ProductOrder.name,
        schema: ProductOrderSchema,
      },
    ]),
  ],
  providers: [FactoryResolver, FactoryService, FactoryRepository],
  exports: [FactoryService],
})
export class FactoryModule {}
