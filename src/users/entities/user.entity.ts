import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
}

export enum AuthRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  ANY = 'ANY',
}

export type UserRole = Exclude<keyof typeof UserRoleEnum, 'ANY'>;
export interface UserInterface {
  id: string;
  password: string;
  role: UserRoleEnum;
}

registerEnumType(UserRoleEnum, {
  name: 'UserRole',
});

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class User extends AbstractEntity implements UserInterface {
  @Field(() => String)
  @Prop({ type: String, unique: true })
  id: string;

  @Prop({ type: String })
  password: string;

  @Field(() => UserRoleEnum)
  @Prop({ type: String, enum: UserRoleEnum })
  role: UserRoleEnum;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
