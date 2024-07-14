import { InputType, Int, Field } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { StockInterface } from '../entities/stock.entity';
import { Type } from 'class-transformer';

@InputType()
export class CreateSingleStockInput
  implements Omit<StockInterface, 'product' | 'storage'>
{
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '제품이름을 입력하세요.' })
  productName: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '창고이름을 입력하세요.' })
  storageName: string;

  @Field(() => Int)
  @IsNumber()
  @Min(0, { message: '재고는 0 이상의 숫자를 입력하세요.' })
  count: number;

  @IsBoolean()
  @IsNotEmpty({ message: '재고가 부자재 인지 여부를 입력하세요.' })
  @Field(() => Boolean)
  isSubsidiary: boolean;
}

@InputType()
export class CreateStockInput {
  @ArrayNotEmpty({ message: '1개 이상의 재고를 입력하세요.' })
  @Field(() => [CreateSingleStockInput], { nullable: false })
  @Type(() => CreateSingleStockInput)
  @ValidateNested({ each: true })
  stocks: CreateSingleStockInput[];
}
