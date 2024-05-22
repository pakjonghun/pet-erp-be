import { Field, Int, ObjectType, PickType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Subsidiary } from 'src/subsidiary/entities/subsidiary.entity';

@ObjectType()
export class SubsidiaryCountColumn extends PickType(Subsidiary, ['name']) {
  @Field(() => Int)
  count: number;
}

@ObjectType()
export class SubsidiaryCountStocksOutput extends FindManyOutput {
  @Field(() => [SubsidiaryCountColumn])
  data: SubsidiaryCountColumn[];
}
