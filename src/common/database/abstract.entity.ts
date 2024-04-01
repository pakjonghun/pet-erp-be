import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';

@Schema()
@ObjectType({ isAbstract: true })
export class AbstractEntity {
  @Field(() => ID)
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;
}
