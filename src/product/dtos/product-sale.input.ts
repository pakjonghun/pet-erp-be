import { Field, InputType, Int, OmitType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { IsDateValidate } from 'src/common/validations/date.validation';
import { IsNumber, IsOptional } from 'class-validator';
import { ProductSaleMenu } from './product-sale-menu.output';

type SortKeyType = Partial<
  Record<keyof ProductSaleMenu, keyof ProductSaleMenu>
>;
const sortKey: SortKeyType & { totalAssetCost: string } = {
  accPayCost: 'accPayCost',
  accWonCost: 'accWonCost',
  accCount: 'accCount',
  stock: 'stock',
  recentCreateDate: 'recentCreateDate',
  totalAssetCost: 'totalAssetCost',
};

@InputType()
export class ProductSaleInput extends OmitType(FindManyDTO, ['order', 'sort']) {
  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;

  @Field(() => String)
  @IsOneOf(sortKey, { message: '정렬 할 수 있는 키 값을 입력하세요.' })
  sort: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  order: 1 | -1 | null;
}
