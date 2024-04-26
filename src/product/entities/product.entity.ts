import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { ProductCategory } from 'src/product-category/entities/product-category.entity';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface ProductInterface {
  code: string;
  barCode?: string;
  name: string;
  wonPrice?: number;
  salePrice?: number;
  leadTime?: number;
  maintainDate?: number;
  category?: ProductCategory;
}

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Product extends AbstractEntity implements ProductInterface {
  @Field(() => String)
  @Prop({
    type: String,
    required: [true, '상품 코드를 입력해주세요.'],
    unique: true,
  })
  code: string;

  @Field(() => String, { nullable: true })
  @Prop({ type: String })
  barCode?: string;

  @Field(() => String)
  @Prop({
    type: String,
    required: [true, '상품 이름을 입력해주세요.'],
  })
  name: string;

  @Field(() => Int, { nullable: true })
  @Prop({
    type: Number,
    min: [0, '상품 가격은 0이상의 값을 입력해주세요.'],
  })
  wonPrice?: number;

  @Field(() => Int, { nullable: true })
  @Prop({
    type: Number,
    min: [0, '상품 가격은 0이상의 값을 입력해주세요.'],
  })
  salePrice?: number;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number })
  leadTime?: number;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number })
  maintainDate?: number;

  @Field(() => ProductCategory, { nullable: true })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: ProductCategory.name })
  category?: ProductCategory;
}

export const productSchema = SchemaFactory.createForClass(Product);
