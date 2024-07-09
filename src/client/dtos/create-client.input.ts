import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { ClientInterface, ClientType } from '../entities/client.entity';

@InputType()
export class CreateClientInput implements ClientInterface {
  @Field(() => String)
  @IsNotEmpty({ message: '거래처 코드를 입력하세요.' })
  code: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0, { message: '수수료 비율로 0 이상의 값을 입력하세요.' })
  @Max(100, { message: '수수료 비율로 100 이하의 값을 입력하세요.' })
  feeRate?: number;

  @Field(() => String, { nullable: true })
  @IsOneOf(ClientType, { message: '올바른 거래처의 타입을 입력하세요.' })
  clientType: ClientType;

  @Field(() => String, { nullable: true })
  @IsOptional()
  businessName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  businessNumber?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  payDate?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  manager?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  managerTel?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  inActive?: boolean;

  @Field(() => String)
  @IsNotEmpty({ message: '거래처 이름을 입력하세요.' })
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  storageName: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  deliveryFreeProductCodeList?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  deliveryNotFreeProductCodeList?: string[];
}
