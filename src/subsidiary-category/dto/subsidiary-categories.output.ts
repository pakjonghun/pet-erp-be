import { Field, ObjectType } from '@nestjs/graphql';
import { FindManyOutput } from 'src/common/dtos/find-many.output';
import { SubsidiaryCategory } from '../entities/subsidiary-category.entity';

@ObjectType()
export class SubsidiaryCategoriesOutput extends FindManyOutput {
  @Field(() => [SubsidiaryCategory])
  data: SubsidiaryCategory[];
}
