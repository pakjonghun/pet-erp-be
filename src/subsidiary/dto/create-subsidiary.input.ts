import { InputType, Int, Field } from '@nestjs/graphql';
import { SubsidiaryInterface } from '../entities/subsidiary.entity';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  NotContains,
} from 'class-validator';

@InputType()
export class CreateSubsidiaryInput
  implements Omit<SubsidiaryInterface, 'productList' | 'category'>
{
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '부자재 코드를 입력하세요.' })
  code: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '부자재 이름을 입력하세요.' })
  @NotContains(',', { message: `',' 는 부자재 이름에 포함될 수 없습니다.` })
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString({ message: '올바른 부자재 분류를 입력하세요.' })
  category?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
    message: '부자재에 매칭되는 제품이름의 타입을 문자입로 입력하세요.',
  })
  productList: string[];

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: '부자재 원가는 0 이상의 값을 입력하세요.' })
  wonPrice?: number;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: '부자재 리드타임은 0 이상의 값을 입력하세요.' })
  leadTime?: number;
}
