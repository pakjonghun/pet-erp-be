import { InputType, Int, Field } from '@nestjs/graphql';
import { SubsidiaryInterface } from '../entities/subsidiary.entity';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsObjectId } from 'src/common/validations/id.validation';

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
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsObjectId({ message: '부자재의 카테고리에 올바른 objectId 를 입력하세요' })
  category?: Types.ObjectId;

  @Field(() => [String])
  @IsArray()
  @IsObjectId({
    each: true,
    message: '부자재 제품 목록에 올바른 objectId 를 입력하세요.',
  })
  productList: Types.ObjectId[];

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
