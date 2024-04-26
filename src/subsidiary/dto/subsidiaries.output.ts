import { Field, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Subsidiary } from '../entities/subsidiary.entity';

@ObjectType()
export class SubsidiariesOutput extends FindManyOutput {
  @Field(() => [Subsidiary])
  data: Subsidiary[];
}
