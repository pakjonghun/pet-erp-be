import { InputType, Field } from '@nestjs/graphql';
import { CategoryInterface } from '../entities/category.entity';

@InputType()
export class CreateCategoryInput implements CategoryInterface {
  @Field(() => String)
  name: string;
}
