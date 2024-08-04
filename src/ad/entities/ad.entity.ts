import { ObjectType, Field, registerEnumType, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum AdType {
  CHANNEL_APP_PRODUCT = 'CHANNEL_APP_PRODUCT',
  CHANNEL_SPECIAL_PRODUCT = 'CHANNEL_SPECIAL_PRODUCT',
  CHANNEL_PRODUCT_RATE = 'CHANNEL_PRODUCT_RATE',
  COMPANY_RATE = 'COMPANY_RATE',
}

export interface AdInterface {
  from: Date;
  to: Date;
  type: AdType;
  clientCode: string;
  productCodeList: string[];
  price: number;
}

registerEnumType(AdType, {
  name: 'AdType',
});

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Ad extends AbstractEntity implements AdInterface {
  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  productCodeList: string[];

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  clientCode: string;

  @Field(() => AdType)
  @Prop({ type: String, enum: AdType })
  type: AdType;

  @Field(() => Int)
  @Prop({ type: Number })
  price: number;

  @Prop({ type: Date })
  @Field(() => Date)
  from: Date;

  @Prop({ type: Date })
  @Field(() => Date)
  to: Date;
}

export const adSchema = SchemaFactory.createForClass(Ad);
