import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface ProductInterface {
  code: string;
  name: string;
  wonPrice: number;
  salePrice: number;
  leadTime: number;
  maintainDate?: number;
  category?: string;
}

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Product extends AbstractEntity implements ProductInterface {
  @Field(() => String)
  @Prop({ type: String, unique: true })
  code: string;

  @Field(() => String)
  @Prop({ type: String, required: true })
  name: string;

  @Field(() => Int)
  @Prop({ type: Number, required: true })
  @Field(() => Int)
  @Prop({ type: Number, required: true })
  wonPrice: number;

  @Field(() => Int)
  @Prop({ type: Number, required: true })
  salePrice: number;

  @Field(() => Int)
  @Prop({ type: Number, required: true })
  leadTime: number;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number })
  maintainDate?: number;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  category?: string;
}

export const productSchema = SchemaFactory.createForClass(Product);
