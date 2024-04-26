import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
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
  @Prop({
    type: String,
    unique: true,
    required: [true, '부자재 분류를 입력해주세요'],
  })
  @Field(() => String)
  name: string;
}

export const SubsidiaryCategorySchema =
  SchemaFactory.createForClass(SubsidiaryCategory);
