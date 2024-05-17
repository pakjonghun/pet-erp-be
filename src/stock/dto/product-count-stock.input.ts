import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class ProductCountStocksInput extends FindManyDTO {
  @Field(() => String)
  @IsString()
  storageName: string;
}
