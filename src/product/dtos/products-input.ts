import { Field, InputType, PickType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class ProductsInput extends PickType(FindManyDTO, [
  'keyword',
  'limit',
  'skip',
  'order',
  'sort',
]) {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  keywordTarget?: string;
}
