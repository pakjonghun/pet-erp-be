import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { validator } from 'src/common/validations/schema-type.validation';

export interface ProductInterface {
  code: string;
  name: string;
  wonPrice: number;
  salePrice: number;
  leadTime?: number;
  maintainDate?: number;
  category?: string;
}

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Product extends AbstractEntity implements ProductInterface {
  @Field(() => String)
  @Prop({
    type: String,
    required: [true, '상품 코드를 입력해주세요.'],
    validate: validator('string'),
    unique: true,
  })
  code: string;

  @Field(() => String)
  @Prop({
    type: String,
    required: [true, '상품 이름을 입력해주세요.'],
    validators: validator('string'),
  })
  name: string;

  @Field(() => Int)
  @Prop({
    type: Number,
    validators: validator('number'),
    required: [true, '상품 원가를 입력해주세요.'],
    min: [0, '상품 가격은 0이상의 값을 입력해주세요.'],
  })
  wonPrice: number;

  @Field(() => Int)
  @Prop({
    type: Number,
    required: [true, '상품 판매가를 입력해주세요.'],
    validators: validator('number'),
    min: [0, '상품 가격은 0이상의 값을 입력해주세요.'],
  })
  salePrice: number;

  @Field(() => String, { nullable: true })
  @Prop({ type: String, validators: validator('string') })
  category?: string;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number, validators: validator('number') })
  leadTime?: number;

  @Field(() => Int, { nullable: true })
  @Prop({ type: Number, validators: validator('number') })
  maintainDate?: number;
}

export const productSchema = SchemaFactory.createForClass(Product);
