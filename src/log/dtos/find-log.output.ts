import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Log } from '../entities/log.entity';

@ObjectType()
export class FindLogsResponseDTO {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [Log])
  data: Log[];
}
