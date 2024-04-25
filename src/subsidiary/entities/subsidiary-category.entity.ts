import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

interface SubsidiaryCategoryInterface {
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
