import { CreateWholesaleSupplierInput } from './create-wholesale-supplier.input';
import { InputType, Field, Int, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateWholesaleSupplierInput extends PartialType(CreateWholesaleSupplierInput) {
  @Field(() => Int)
  id: number;
}
