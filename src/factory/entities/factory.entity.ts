import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface FactoryInterface {
  name: string;
  phoneNumber: string;
  address: string;
  note: string;
  productList?: string[];
}

@Schema({ versionKey: false, timestamps: { createdAt: false } })
@ObjectType()
export class Factory extends AbstractEntity implements FactoryInterface {
  @Prop({ type: String, unique: true })
  @Field(() => String)
  name: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  phoneNumber: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  address: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  note: string;

  @Prop({ type: [String] })
  @Field(() => [String], { nullable: true })
  productList?: string[];
}

export const FactorySchema = SchemaFactory.createForClass(Factory);
