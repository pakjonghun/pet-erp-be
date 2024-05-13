import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { Field, ObjectType } from '@nestjs/graphql';
import { Storage } from '../entities/storage.entity';

@ObjectType()
export class StoragesOutput extends FindManyOutput {
  @Field(() => [Storage])
  data: Storage[];
}
