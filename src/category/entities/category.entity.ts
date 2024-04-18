import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { SchemaTypes, Types } from 'mongoose';

export interface CategoryInterface {
  name: string;
}

@ObjectType()
@Schema({
  versionKey: false,
  timestamps: { updatedAt: false },
})
export class Category extends AbstractEntity {
  @Field(() => ID, { nullable: true })
  @Prop({ type: SchemaTypes.ObjectId })
  _id: Types.ObjectId;

  @Field(() => String, { nullable: true })
  @Prop({
    type: String,
    required: [true, '제품 분류를 입력하세요.'],
    unique: true,
  })
  name: string;
}

export const categorySchema = SchemaFactory.createForClass(Category);
