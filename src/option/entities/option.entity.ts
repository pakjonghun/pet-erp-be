import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface OptionInterface {
  id: string;
  name: string;
  count: number;
  productCodeList: string[];
}

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Option extends AbstractEntity implements OptionInterface {
  @Prop({ type: String, unique: true, required: true })
  @Field(() => String)
  id: string;

  @Prop({ type: String, required: true })
  @Field(() => String)
  name: string;

  @Prop({
    type: Number,
    min: [1, '제품 숫자는 1이상의 값을 입력하세요'],
    required: true,
  })
  @Field(() => Int)
  count: number;

  @Prop({ type: [String], required: true })
  @Field(() => [String])
  productCodeList: string[];
}

export const OptionSchema = SchemaFactory.createForClass(Option);
