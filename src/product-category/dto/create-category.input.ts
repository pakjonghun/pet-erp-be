import { InputType, Field } from '@nestjs/graphql';
import { ProductCategoryInterface } from '../entities/product-category.entity';
import { MinLength } from 'class-validator';

@InputType()
export class CreateCategoryInput implements ProductCategoryInterface {
  @Field(() => String)
  @MinLength(1, { message: '제품 분류는 1글자 이상을 입력하세요.' })
  name: string;
}
