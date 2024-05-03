import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Product } from 'src/product/entities/product.entity';
import { Storage } from 'src/storage/entities/storage.entity';

interface StockInterface {
  product: Product;
  storage: Storage;
  isSubsidiary: boolean;
}

@Schema({ timestamps: { createdAt: false }, versionKey: false })
@ObjectType()
export class Stock extends AbstractEntity implements StockInterface {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Product.name })
  @Field(() => Product)
  product: Product;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Storage.name })
  @Field(() => Storage)
  storage: Storage;

  @Prop({ type: Boolean, default: false })
  @Field(() => Boolean)
  isSubsidiary: boolean;
}
