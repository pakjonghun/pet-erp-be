import { ObjectType, Field, Int, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { patternValidator } from 'src/common/validations/schema-type.validation';

export enum ClientType {
  wholeSale = 'wholeSale',
  platform = 'platform',
}

registerEnumType(ClientType, { name: 'clientType' });

export interface ClientInterface {
  code: string;
  feeRate?: number;
  clientType: ClientType;
  businessName: string;
  businessNumber?: string;
  payDate?: Date;
  manager?: string;
  managerTel?: string;
  managerEmail?: string;
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
    max: [100, '수수료 비율은 100이하의 값을 입력하세요.'],
  })
  @Field(() => Int, { nullable: true })
  feeRate?: number;

  @Prop({
    type: String,
    enum: ClientType,
    required: [true, '거래처의 타입을 입력하세요.'],
  })
  @Field(() => ClientType)
  clientType: ClientType;

  @Prop({ type: String, required: [true, '거래처 이름을 입력하세요.'] })
  @Field(() => String)
  businessName: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  businessNumber?: string;

  @Prop({ type: Date })
  @Field(() => Date, { nullable: true })
  payDate?: Date;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  manager?: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  managerTel?: string;

  @Prop({ type: String, validators: patternValidator('email') })
  @Field(() => String, { nullable: true })
  managerEmail?: string;
}

export const clientSchema = SchemaFactory.createForClass(Client);
