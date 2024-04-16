import { ObjectType, Field } from '@nestjs/graphql';
import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface CategoryInterface {
  name: string;
}

@ObjectType()
@Schema({ versionKey: false, timestamps: { createdAt: true } })
export class Category extends AbstractEntity implements CategoryInterface {
  @Field(() => String)
  name: string;
}

export const categorySchema = SchemaFactory.createForClass(Category);
