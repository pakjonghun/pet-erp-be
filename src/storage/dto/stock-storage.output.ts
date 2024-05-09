import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Storage } from '../entities/storage.entity';

@ObjectType()
export class StockStorageOutput extends Storage {
  @Field(() => Int)
  totalStock: number;

  @Field(() => Int)
  totalWonCost: number;
}
