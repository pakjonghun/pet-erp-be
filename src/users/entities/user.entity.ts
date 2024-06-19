import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  BACK_DELETE = 'BACK_DELETE',
  BACK_EDIT = 'BACK_EDIT',
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_EDIT = 'ORDER_EDIT',
  ORDER_DELETE = 'ORDER_DELETE',
  SALE_CREATE = 'SALE_CREATE',
  SALE_EDIT = 'SALE_EDIT',
  SALE_DELETE = 'SALE_DELETE',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  ADMIN_IP = 'ADMIN_IP',
  ADMIN_ACCOUNT = 'ADMIN_ACCOUNT',
  ADMIN_DELIVERY = 'ADMIN_DELIVERY',
  ADMIN_LOG = 'ADMIN_LOG',
}

export enum AuthRoleEnum {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  ANY = 'ANY',
  BACK_DELETE = 'BACK_DELETE',
  BACK_EDIT = 'BACK_EDIT',
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ORDER_CREATE = 'ORDER_CREATE',
  ORDER_EDIT = 'ORDER_EDIT',
  ORDER_DELETE = 'ORDER_DELETE',
  SALE_CREATE = 'SALE_CREATE',
  SALE_EDIT = 'SALE_EDIT',
  SALE_DELETE = 'SALE_DELETE',
  ADMIN_ACCESS = 'ADMIN_ACCESS',
  ADMIN_IP = 'ADMIN_IP',
  ADMIN_ACCOUNT = 'ADMIN_ACCOUNT',
  ADMIN_DELIVERY = 'ADMIN_DELIVERY',
  ADMIN_LOG = '  ADMIN_LOG',
}

export interface UserInterface {
  id: string;
  password: string;
  role: UserRoleEnum[];
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

  @Field(() => [UserRoleEnum])
  @Prop({ type: [String], enum: [UserRoleEnum] })
  role: UserRoleEnum[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

export const userSchema = SchemaFactory.createForClass(User);
