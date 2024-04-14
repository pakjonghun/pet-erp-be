import { Field, InputType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { ProductInterface } from '../entities/product.entity';
import { IsOneOf } from 'src/common/validations/enum.validation';

const product: Pick<ProductInterface, 'code' | 'name'> = {
  code: 'code',
  name: 'name',
};

@InputType()
export class ProductSaleInput extends FindManyDTO {
  @Field(() => String)
  @IsOneOf(product, { message: '검색할수 없는 키워드 입니다.' })
  keywordTarget: keyof ProductInterface;
}
