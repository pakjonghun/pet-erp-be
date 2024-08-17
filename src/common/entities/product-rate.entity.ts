import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Product } from 'src/product/entities/product.entity';

@Schema({ versionKey: false, timestamps: true })
export class ProductRate {
  productCode: Product['code'];

  @Prop(() => Number)
  rate: number;
}

export const productRateSchema = SchemaFactory.createForClass(ProductRate);
