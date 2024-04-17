import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface CategoryInterface {
  name: string;
}

@ObjectType()
@Schema({
  versionKey: false,
  timestamps: { updatedAt: false },
})
export class Category extends AbstractEntity implements CategoryInterface {
  @Field(() => String)
  @Prop({ type: String, required: [true, '제품 분류를 입력하세요.'] })
  name: string;
}

export const categorySchema = SchemaFactory.createForClass(Category);
