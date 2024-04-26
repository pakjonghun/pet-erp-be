import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';
import { SubsidiaryCategoryInterface } from '../entities/subsidiary-category.entity';

@InputType()
export class CreateSubsidiaryCategoryInput
  implements SubsidiaryCategoryInterface
{
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '부자재 분류 이름을 입력하세요' })
  name: string;
}
