import { InputType, PickType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class ProductsInput extends PickType(FindManyDTO, [
  'keyword',
  'limit',
  'skip',
]) {}
