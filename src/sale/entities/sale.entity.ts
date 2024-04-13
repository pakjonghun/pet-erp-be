import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

interface SaleInterface {
  code: string;
  shoppingMall?: string;
  count?: string;
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
  payCost?: string;
  orderStatus?: string;
  mallId?: string;
  wonCost?: string;
  deliveryCost: number;
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
  @Field(() => String, { nullable: true })
  count?: string;

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

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  payCost?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  orderStatus?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  mallId?: string;

  @Prop({ default: null })
  @Field(() => String, { nullable: true })
  wonCost?: string;

  @Prop({ required: true })
  @Field(() => String, { nullable: true })
  deliveryCost: number;
}

export const saleSchema = SchemaFactory.createForClass(Sale);
