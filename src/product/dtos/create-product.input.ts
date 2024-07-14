import { InputType, Int, Field } from '@nestjs/graphql';
import { ProductInterface } from '../entities/product.entity';
import { IsOptional, IsString, Min, NotContains } from 'class-validator';
import { Prop } from '@nestjs/mongoose';

@InputType()
export class CreateProductInput
  implements Omit<ProductInterface, 'category' | 'storageId'>
{
  @Field(() => String)
  @IsString({ message: '상품코드는 문자열 타입을 입력해주세요.' })
  code: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: '상품코드는 문자열 타입을 입력해주세요.' })
  barCode?: string;

  @Field(() => String)
  @IsString({ message: '상품이름은 문자열 타입을 입력해주세요.' })
  @NotContains(',', { message: `',' 는 제품 이름에 포함될 수 없습니다.` })
  name: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0, { message: '상품원가는 0이상의 값을 입력해주세요.' })
  wonPrice: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0, { message: '상품판매가는 0이상의 값을 입력해주세요.' })
  salePrice: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(0, { message: '상품 리드타임은 0이상의 값을 입력해주세요.' })
  leadTime?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  category?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  storageName?: string;

  @Field(() => Boolean, { nullable: true })
  @Prop({ type: Boolean })
  isFreeDeliveryFee?: boolean;
}
