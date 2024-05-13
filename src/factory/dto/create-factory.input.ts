import { IsNotEmpty, IsString } from 'class-validator';
import { FactoryInterface } from './../entities/factory.entity';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateFactoryInput implements FactoryInterface {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '공장 이름을 입력하세요.' })
  name: string;

  @Field(() => String, { nullable: true })
  address: string;

  @Field(() => String, { nullable: true })
  note: string;

  @Field(() => String, { nullable: true })
  phoneNumber: string;
}
