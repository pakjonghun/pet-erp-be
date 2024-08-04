import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { AdInterface, AdType } from '../entities/ad.entity';
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOneOf } from 'src/common/validations/enum.validation';

@InputType()
export class CreateAdInput implements AdInterface {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsString()
  productCodeList: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  clientCode: string;

  @Field(() => AdType)
  @IsOneOf(AdType, { message: '올바른 광고 타입을 입력하세요.' })
  type: AdType;

  @Field(() => Date)
  @IsDate()
  from: Date;

  @Field(() => Date)
  @IsDate()
  to: Date;

  @Field(() => Int)
  @IsNumber()
  price: number;
}
