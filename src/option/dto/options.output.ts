import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Option } from '../entities/option.entity';
import { Field, Int, ObjectType, OmitType, PickType } from '@nestjs/graphql';
import { Product } from 'src/product/entities/product.entity';

@ObjectType()
export class OutProduct extends PickType(Product, ['code', 'name']) {}

@ObjectType()
export class OutOptionProduct {
  @Field(() => Int)
  count: number;

  @Field(() => OutProduct)
  productCode: OutProduct;
}

@ObjectType()
export class OutputOption extends OmitType(Option, ['productOptionList']) {
  @Field(() => [OutOptionProduct])
  productOptionList: OutOptionProduct[];
}

@ObjectType()
export class OptionsOutput extends FindManyOutput {
  @Field(() => [OutputOption])
  data: OutputOption[];
}
