import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface SubsidiaryCategoryInterface {
  name: string;
}

@ObjectType()
@Schema({ versionKey: false, timestamps: { updatedAt: false } })
export class SubsidiaryCategory
  extends AbstractEntity
  implements SubsidiaryCategoryInterface
{
  @Prop({ type: SchemaTypes.ObjectId })
  @Field(() => ID, { nullable: true })
  _id: Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
    required: [true, '부자재 분류를 입력해주세요'],
  })
  @Field(() => String, { nullable: true })
  name: string;
}

export const SubsidiaryCategorySchema =
  SchemaFactory.createForClass(SubsidiaryCategory);
