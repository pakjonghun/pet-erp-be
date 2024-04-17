import { InputType, Field } from '@nestjs/graphql';
import { CategoryInterface } from '../entities/category.entity';
import { MinLength } from 'class-validator';

@InputType()
export class CreateCategoryInput implements CategoryInterface {
  @Field(() => String)
  @MinLength(1, { message: '제품 분류는 1글자 이상을 입력하세요.' })
  name: string;
}
