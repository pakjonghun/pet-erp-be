import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Product } from 'src/product/entities/product.entity';

@Schema({ versionKey: false, timestamps: true })
export class ClientProductRate {
  productCode: Product['code'];
  clientCode: Client['code'];

  @Prop(() => Number)
  rate: number;
}

export const clientProductRateSchema =
  SchemaFactory.createForClass(ClientProductRate);
