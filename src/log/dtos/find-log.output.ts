import { Field, ObjectType } from '@nestjs/graphql';
import { Log } from '../entities/log.entity';
import { FindManyOutput } from 'src/common/dtos/find-many.output';

@ObjectType()
export class FindLogsResponseDTO extends FindManyOutput {
  @Field(() => [Log])
  data: Log[];
}
