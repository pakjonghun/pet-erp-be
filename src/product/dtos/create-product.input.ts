import { InputType, Int, Field } from '@nestjs/graphql';
import { ProductInterface } from '../entities/product.entity';
import { IsOptional, IsString, Min } from 'class-validator';
import { IsObjectId } from 'src/common/validations/id.validation';
import { Types } from 'mongoose';

@InputType()
export class CreateProductInput implements Omit<ProductInterface, 'category'> {
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
  @IsObjectId({ message: '올바른 objectId 를 입력하세요' })
  category?: Types.ObjectId;
}
