import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Factory } from '../entities/factory.entity';
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class FactoriesOutput extends FindManyOutput {
  @Field(() => [Factory])
  data: Factory[];
}
