import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
@ObjectType()
export class DeliveryCost {
  @Field(() => Float)
  @Prop({ type: Number })
  deliveryCost: number;

  @Field(() => Int)
  @Prop({ type: Number })
  year: number;

  @Field(() => Int)
  @Prop({ type: Number })
  month: number;
}

export const DeliveryCostSchema = SchemaFactory.createForClass(DeliveryCost);
