import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Option } from '../entities/option.entity';
import { Field, ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { Product } from 'src/product/entities/product.entity';

@ObjectType()
export class OutProduct extends PickType(Product, ['code', 'name']) {}

@ObjectType()
export class OutputOption extends OmitType(Option, ['productCodeList']) {
  @Field(() => OutProduct)
  productList: OutProduct;
}

@ObjectType()
export class OptionsOutput extends FindManyOutput {
  @Field(() => [OutputOption])
  data: OutputOption[];
}
