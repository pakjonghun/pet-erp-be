import { ObjectType, Field, Float } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

interface WholeSaleSupplierInterface {
  name: string;
  address1?: string;
  telephoneNumber1?: string;
  feeRate?: number;
}

@Schema({ versionKey: false, timestamps: { createdAt: false } })
@ObjectType()
export class WholesaleSupplier
  extends AbstractEntity
  implements WholeSaleSupplierInterface
{
  @Prop({ type: String, required: [true, '도매 거래처 이름을 입력하세요.'] })
  @Field(() => String)
  name: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  address1?: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @Prop({ type: String, min: [0, '수수료는 0보다 큰 숫자를 입력하세요.'] })
  @Field(() => Float, { nullable: true })
  feeRate?: number;
}
