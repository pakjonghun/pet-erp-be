import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { ClientInterface, ClientType } from '../entities/client.entity';
import { IsDateValidate } from 'src/common/validations/date.validation';

@InputType()
export class CreateClientInput implements ClientInterface {
  @Field(() => String)
  @IsNotEmpty({ message: '거래처 코드를 입력하세요.' })
  code: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Min(0, { message: '수수료 비율로 0 이상의 값을 입력하세요.' })
  @Max(0, { message: '수수료 비율로 100 이하의 값을 입력하세요.' })
  feeRate?: number;

  @Field(() => String, { nullable: true })
  @IsOneOf(ClientType, { message: '올바른 거래처의 타입을 입력하세요.' })
  clientType: ClientType;

  @Field(() => String, { nullable: true })
  @IsNotEmpty({ message: '거래처 이름을 입력하세요.' })
  businessName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  businessNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsDateValidate({ message: '결제일은 올바른 형식의 날짜를 입력하세요.' })
  payDate?: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  manager?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  managerTel?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail({}, { message: '이메일은 이메일 형식을 입력하세요.' })
  managerEmail?: string;
}
