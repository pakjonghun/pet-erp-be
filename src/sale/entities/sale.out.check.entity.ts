import { Field, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, versionKey: false })
@ObjectType()
export class SaleOutCheck {
  @Field(() => Boolean)
  @Prop({ type: Boolean })
  isChecked: boolean;
}

export const SaleOutCheckSchema = SchemaFactory.createForClass(SaleOutCheck);
