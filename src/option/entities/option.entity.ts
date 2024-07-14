import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface OptionProductInterface {
  productCode: string;
  count: number;
}

export interface OptionInterface {
  id: string;
  name: string;
  productOptionList: OptionProductInterface[];
}

@ObjectType()
export class OptionProduct implements OptionProductInterface {
  @Field(() => String)
  productCode: string;

  @Field(() => Int)
  count: number;
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

  @Prop({ type: [{ productCode: String, count: Number }], required: true })
  @Field(() => [OptionProduct])
  productOptionList: OptionProductInterface[];
}

export const OptionSchema = SchemaFactory.createForClass(Option);
