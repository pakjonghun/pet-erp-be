import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';

interface StorageInterface {
  name: string;
  phoneNumber: string;
  address: string;
  note: string;
}

@Schema({ timestamps: { createdAt: false }, versionKey: false })
@ObjectType()
export class Storage implements StorageInterface {
  @Prop({ type: String })
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
