import { Field, Float, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
@ObjectType()
export class DeliveryCost {
  @Field(() => Float)
  @Prop({ type: Number })
  deliveryCost: number;
}

export const DeliveryCostSchema = SchemaFactory.createForClass(DeliveryCost);
