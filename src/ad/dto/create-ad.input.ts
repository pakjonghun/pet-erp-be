import {
  ArrayNotEmpty,
  IsDate,
  IsNumber,
  Validate,
  ValidateNested,
} from 'class-validator';
import { AdInterface, AdType } from '../entities/ad.entity';
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { ChannelOrProductValidator } from '../validation/adTypeValidator';
import { Type } from 'class-transformer';

@InputType()
export class CreateAdInputItem implements AdInterface {
  @Field(() => [String], { nullable: true })
  @Validate(ChannelOrProductValidator, ['productCodeList'])
  productCodeList: string[];

  @Field(() => String, { nullable: true })
  @Validate(ChannelOrProductValidator, ['clientCode'])
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

@InputType()
export class CreateAdInput {
  @Field(() => [CreateAdInputItem])
  @ArrayNotEmpty({ message: '1개 이상의 광고를 입력해주세요.' })
  @ValidateNested({ each: true })
  @Type(() => CreateAdInputItem)
  createAdsInput: CreateAdInputItem[];
}
