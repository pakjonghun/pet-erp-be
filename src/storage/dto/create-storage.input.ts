import { InputType, Int, Field } from '@nestjs/graphql';
import { StorageInterface } from '../entities/storage.entity';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateStorageInput implements StorageInterface {
  @Field(() => String)
  @IsString()
  @IsNotEmpty({ message: '창고 이름을 입력하세요.' })
  name: string;

  @Field(() => String, { nullable: true })
  address: string;

  @Field(() => String, { nullable: true })
  note: string;

  @Field(() => String, { nullable: true })
  phoneNumber: string;
}
