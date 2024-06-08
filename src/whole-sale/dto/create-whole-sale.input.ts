import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { Type } from 'class-transformer';

@InputType()
export class CreateWholeSaleProduct {
  @IsString()
  @IsNotEmpty({ message: '창고 이름을 입력하세요.' })
  @Field(() => String)
  storageName: string;

  @IsString()
  @IsNotEmpty({ message: '제품 이름을 입력해주세요.' })
  @Field(() => String)
  productName: string;

  @IsString()
  @IsNotEmpty({ message: '제품 코드를 입력해주세요.' })
  @Field(() => String)
  productCode: string;

  @IsNumber()
  @Min(1, { message: '수량은 1이상의 숫자를 입력하세요.' })
  @Field(() => Int)
  count: number;

  @IsNumber()
  @Min(0, { message: '판매가는 0이상의 숫자를 입력하세요.' })
  @Field(() => Int)
  payCost: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: '원가는 0 이상의 숫자를 입력하세요.' })
  @Field(() => Int, { nullable: true })
  wonCost?: number;
}
@InputType()
export class CreateWholeSaleInput {
  @IsBoolean()
  @Field(() => Boolean, { nullable: true })
  isDone: boolean;

  @IsString()
  @IsNotEmpty({ message: '판매 거래처를 입력하세요.' })
  @Field(() => String)
  mallId: string;

  @IsOptional()
  @IsDateValidate({ message: '올바른 판매 날짜를 입력하세요.' })
  @Field(() => Date)
  saleAt: Date;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @IsArray()
  @ArrayNotEmpty({ message: '1개 이상의 제품을 입력해주세요.' })
  @ValidateNested({ each: true })
  @Type(() => CreateWholeSaleProduct)
  @Field(() => [CreateWholeSaleProduct])
  productList: CreateWholeSaleProduct[];
}
