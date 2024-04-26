import { InputType, PickType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class SubsidiariesInput extends PickType(FindManyDTO, [
  'keyword',
  'limit',
  'skip',
]) {}
