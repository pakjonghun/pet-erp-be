import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

interface SaleInterface {
  code: string;
  shoppingMall?: string;
  count?: number;
  barCode?: string;
  consignee?: string;
  address1?: string;
  postalCode?: string;
  telephoneNumber1?: string;
  message?: string;
  productName?: string;
  deliveryName?: string;
  invoiceNumber?: string;
  originOrderNumber?: string;
  orderNumber?: string;
  productCode?: string;
  saleAt?: string;
  payCost?: number;
  orderStatus?: string;
  mallId?: string;
  wonCost?: number;
  deliveryCost?: number;
}

@ObjectType()
@Schema({ versionKey: false, timestamps: { createdAt: true } })
export class Sale extends AbstractEntity implements SaleInterface {
  @Prop({ type: String, unique: true })
  @Field(() => String)
  code: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  shoppingMall?: string;

  @Prop({ default: null })
  @Field(() => Int, { nullable: true })
  count?: number;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  barCode?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  consignee?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  address1?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  postalCode?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  message?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  productName?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  deliveryName?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  invoiceNumber?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  originOrderNumber?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  orderNumber?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  productCode?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  saleAt?: string;

  @Prop({ default: 0 })
  @Field(() => Int, { nullable: true })
  payCost?: number;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  orderStatus?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  mallId?: string;

  @Prop({ default: 0 })
  @Field(() => Int, { nullable: true })
  wonCost?: number;

  @Prop({ default: 0 })
  @Field(() => String, { nullable: true })
  deliveryCost?: number;
}

export const saleSchema = SchemaFactory.createForClass(Sale);
