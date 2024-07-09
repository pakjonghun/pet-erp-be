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

export const HangleToClientType = {
  도매몰: 'wholeSale',
  도매: 'wholeSale',
  플렛폼: 'platform',
  cs: 'cs',
  리워드: 'reward',
  마케팅: 'marketing',
  벤더: 'bender',
  밴더: 'bender',
  오프라인: 'offline',
  오픈마켓: 'openMarket',
  전문몰: 'proMall',
};

export const ClientTypeToHangle = {
  wholeSale: '도매몰',
  platform: '플렛폼',
  cs: 'cs',
  reward: '리워드',
  marketing: '마케팅',
  bender: '밴더',
  offline: '오프라인',
  openMarket: '오픈마켓',
  proMall: '전문몰',
};

registerEnumType(ClientType, { name: 'clientType' });

export interface ClientInterface {
  code: string;
  name: string;
  clientType: ClientType;
  feeRate?: number;
  businessName?: string;
  businessNumber?: string;
  payDate?: number;
  manager?: string;
  managerTel?: string;
  inActive?: boolean;
  storageId?: string;
  deliveryFreeProductCodeList?: string[];
  deliveryNotFreeProductCodeList?: string[];
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
    min: [0, '수수료 비율은 0 이상의 값을 입력하세요.'],
    max: [100, '수수료 비율은 100이하의 값을 입력하세요.'],
  })
  @Field(() => Float, { nullable: true })
  feeRate?: number;

  @Prop({
    type: String,
    unique: true,
    required: [true, '거래처 이름을 입력하세요.'],
  })
  @Field(() => String)
  name: string;

  @Prop({
    type: String,
    enum: {
      values: Object.values(ClientType),
      message: '{VALUE}는 올바른 거래처 타입이 아닙니다.',
    },
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

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  storageId?: string;

  @Prop({ type: [String] })
  @Field(() => [String], { nullable: true })
  deliveryFreeProductCodeList?: string[];

  @Prop({ type: [String] })
  @Field(() => [String], { nullable: true })
  deliveryNotFreeProductCodeList?: string[];
}

export const clientSchema = SchemaFactory.createForClass(Client);
