import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SaleInterface } from './../../sale/entities/sale.entity';
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsObjectId } from 'src/common/validations/id.validation';

@InputType()
export class CreateWholeSaleProductList {
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  count?: number;

  @IsString()
  @IsNotEmpty({ message: '제품 이름을 입력해주세요.' })
  @Field(() => String)
  name: string;

  @IsString()
  @IsNotEmpty({ message: '제품 코드를 입력해주세요.' })
  @Field(() => String)
  code?: string;
}

@InputType()
export class CreateWholeSaleInput implements Omit<SaleInterface, 'code'> {
  @IsString()
  @IsNotEmpty({ message: '창고 아이디를 입력하세요.' })
  @IsObjectId({ message: '올바른 창고 아이디를 입력하세요.' })
  @Field(() => String)
  storage: string;

  @IsOptional()
  @IsString()
  @Field(() => Date, { nullable: true })
  saleAt?: Date;

  @IsOptional()
  @IsString()
  @Field(() => Int, { nullable: true })
  payCost?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  mallId?: string;

  @IsOptional()
  @IsString()
  @Field(() => Int, { nullable: true })
  wonCost?: number;

  @IsArray()
  @ArrayNotEmpty({ message: '1개 이상의 제품을 입력해주세요.' })
  @Field(() => [CreateWholeSaleProductList])
  productList: CreateWholeSaleProductList[];
}
