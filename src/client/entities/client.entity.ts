import {
  ObjectType,
  Field,
  registerEnumType,
  Float,
  Int,
} from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum ClientType {
  wholeSale = 'wholeSale',
  platform = 'platform',
  cs = 'cs',
  reward = 'reward',
  marketing = 'marketing',
  bender = 'bender',
  offline = 'offline',
  openMarket = 'openMarket',
  proMall = 'proMall',
}

registerEnumType(ClientType, { name: 'clientType' });

export interface ClientInterface {
  code: string;
  name: string;
  feeRate?: number;
  clientType: ClientType;
  businessName?: string;
  businessNumber?: string;
  payDate?: number;
  manager?: string;
  managerTel?: string;
  inActive?: boolean;
}

@ObjectType()
@Schema({ versionKey: false, timestamps: true })
export class Client extends AbstractEntity implements ClientInterface {
  @Prop({
    type: String,
    unique: true,
    required: [true, '거래처 코드를 입력하세요.'],
  })
  @Field(() => String)
  code: string;

  @Prop({
    type: Number,
    default: 0,
    min: [0, '수수료 비율은 0 이상의 값을 입력하세요.'],
    max: [1, '수수료 비율은 1이하의 값을 입력하세요.'],
  })
  @Field(() => Float, { nullable: true })
  feeRate?: number;

  @Prop({ type: String, required: [true, '거래처 이름을 입력하세요.'] })
  @Field(() => String)
  name: string;

  @Prop({
    type: String,
    enum: ClientType,
    required: [true, '거래처의 타입을 입력하세요.'],
  })
  @Field(() => ClientType)
  clientType: ClientType;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  businessName?: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  businessNumber?: string;

  @Prop({
    type: Number,
    min: [1, '최소 1이상의 값을 입력하세요.'],
    max: [31, '최대 31까지 값을 입력할 수 있어요.'],
  })
  @Field(() => Int, { nullable: true })
  payDate?: number;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  manager?: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  managerTel?: string;

  @Prop({ type: Boolean, default: true })
  @Field(() => Boolean, { nullable: true })
  inActive?: boolean;
}

export const clientSchema = SchemaFactory.createForClass(Client);
