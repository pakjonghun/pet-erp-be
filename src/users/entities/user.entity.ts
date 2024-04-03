import { ObjectType, Field } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum AUTH_TYPE {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  ANY = 'ANY',
}

export type Role = Exclude<keyof typeof AUTH_TYPE, 'ANY'>;

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class User extends AbstractEntity {
  @Prop({ type: String })
  @Field()
  email: string;

  @Prop({ type: String })
  password: string;

  @Prop({ type: AUTH_TYPE })
  role: Role;
}

export const userSchema = SchemaFactory.createForClass(User);
