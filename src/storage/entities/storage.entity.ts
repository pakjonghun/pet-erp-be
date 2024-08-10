import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export interface StorageInterface {
  name: string;
  phoneNumber: string;
  address: string;
  note: string;
}

@ObjectType()
@Schema({ timestamps: { createdAt: false }, versionKey: false })
export class Storage extends AbstractEntity implements StorageInterface {
  @Prop({
    type: String,
    unique: true,
    required: [true, '창고 이름을 입력하세요.'],
  })
  @Field(() => String)
  name: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  phoneNumber: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  address: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  note: string;
}

export const StorageSchema = SchemaFactory.createForClass(Storage);
