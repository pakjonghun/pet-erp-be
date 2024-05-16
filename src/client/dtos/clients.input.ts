import { Field, InputType, PickType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { ClientType } from '../entities/client.entity';
import { IsOneOf } from 'src/common/validations/enum.validation';

@InputType()
export class ClientsInput extends PickType(FindManyDTO, [
  'keyword',
  'limit',
  'skip',
]) {
  @Field(() => ClientType, { nullable: true })
  @IsOneOf(ClientType, { message: '올바른 거래처 타입을 입력하세요.' })
  clientType?: ClientType;
}
