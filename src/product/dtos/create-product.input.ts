import { InputType, Int, Field } from '@nestjs/graphql';
import { ProductInterface } from '../entities/product.entity';
import { IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class CreateProductInput implements ProductInterface {
  @Field(() => String)
  @IsString({ message: '상품코드는 문자열 타입을 입력해주세요.' })
  code: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: '상품코드는 문자열 타입을 입력해주세요.' })
  barCode?: string;

  @Field(() => String)
  @IsString({ message: '상품이름은 문자열 타입을 입력해주세요.' })
  name: string;

  @Field(() => Int)
  @Min(0, { message: '상품원가는 0이상의 값을 입력해주세요.' })
  wonPrice: number;

  @Field(() => Int)
  @Min(0, { message: '상품판매가는 0이상의 값을 입력해주세요.' })
  salePrice: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0, { message: '상품 리드타임은 0이상의 값을 입력해주세요.' })
  leadTime?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0, { message: '상품 최소 유지날짜는 0이상의 값을 입력해주세요.' })
  maintainDate?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: '상품 카테고리는 문자열 타입을 입력해주세요.' })
  category?: string;
}
