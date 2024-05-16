import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Factory } from 'src/factory/entities/factory.entity';
import { Product } from 'src/product/entities/product.entity';

export interface OrderProductInterface {
  count: number;
  product: Product;
}

export interface ProductOrderInterface {
  factory: Factory;
  products: OrderProductInterface[];
  payCost: number;
  notPayCost: number;
  totalPayCost: number;
  isDone: boolean;
}

@ObjectType()
@Schema({ versionKey: false })
export class OrderProduct implements OrderProductInterface {
  @Prop({ type: Number })
  @Field(() => Int)
  count: number;

  @Field(() => Product)
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Product.name })
  product: Product;

  @Field(() => Product, { nullable: true })
  @Prop({ type: Number })
  leftCount: number;
}

@Schema({ timestamps: true, versionKey: false })
@ObjectType()
export class ProductOrder
  extends AbstractEntity
  implements ProductOrderInterface
{
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Factory.name })
  @Field(() => Factory)
  factory: Factory;

  @Prop({ type: [OrderProduct] })
  @Field(() => [OrderProduct])
  products: OrderProduct[];

  @Prop({ type: Number })
  @Field(() => Int)
  payCost: number;

  @Prop({ type: Number })
  @Field(() => Int)
  notPayCost: number;

  @Prop({ type: Number })
  @Field(() => Int)
  totalPayCost: number;

  @Prop({ type: Boolean, default: false })
  @Field(() => Boolean)
  isDone: boolean;
}

export const ProductOrderSchema = SchemaFactory.createForClass(ProductOrder);
