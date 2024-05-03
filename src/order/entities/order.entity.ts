import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Factory } from 'src/factory/entities/factory.entity';
import { Product } from 'src/product/entities/product.entity';

interface OrderInterface {
  factory: Factory;
  storage: Storage;
  product: Product;
  count: number;
  payCost: number;
  notPayCost: number;
  totalPayCost: number;
}

@Schema({ timestamps: { createdAt: false }, versionKey: false })
@ObjectType()
export class Order implements OrderInterface {
  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: Factory.name })
  @Field(() => Factory)
  factory: Factory;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: Storage.name })
  @Field(() => Storage)
  storage: Storage;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: Product.name })
  @Field(() => Product)
  product: Product;

  @Prop({ type: Number })
  @Field(() => Int)
  count: number;

  @Prop({ type: Number })
  @Field(() => Int)
  payCost: number;

  @Prop({ type: Number })
  @Field(() => Int)
  notPayCost: number;

  @Prop({ type: Number })
  @Field(() => Int)
  totalPayCost: number;
}
