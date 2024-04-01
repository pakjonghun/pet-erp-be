import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class User extends AbstractEntity {
  @Prop({ type: String })
  @Field()
  email: string;

  @Prop({ type: String })
  password: string;
}

export const userSchema = SchemaFactory.createForClass(User);
