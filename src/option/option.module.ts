import { Module } from '@nestjs/common';
import { OptionService } from './option.service';
import { OptionResolver } from './option.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { OptionSchema, Option } from './entities/option.entity';
import { OptionLoader } from './option.loader';
import { Product, productSchema } from 'src/product/entities/product.entity';
import { OptionRepository } from './option.repository';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Option.name,
        schema: OptionSchema,
      },

      {
        name: Product.name,
        schema: productSchema,
      },
    ]),
  ],
  providers: [OptionService, OptionResolver, OptionRepository, OptionLoader],
  exports: [OptionLoader, OptionResolver, OptionService],
})
export class OptionModule {}
