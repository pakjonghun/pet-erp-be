import { Field, InputType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { ProductInterface } from '../entities/product.entity';
import { IsOneOf } from 'src/common/validations/enum.validation';
import { IsDateValidate } from 'src/common/validations/date.validation';

const product: Pick<ProductInterface, 'code' | 'name'> = {
  code: 'code',
  name: 'name',
};

@InputType()
export class ProductSaleInput extends FindManyDTO {
  @Field(() => String)
  @IsOneOf(product, { message: '검색할수 없는 키워드 입니다.' })
  keywordTarget: keyof ProductInterface;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  from: Date;

  @Field(() => Date)
  @IsDateValidate({ message: '올바른 날짜 형식을 입력하세요.' })
  to: Date;
}
