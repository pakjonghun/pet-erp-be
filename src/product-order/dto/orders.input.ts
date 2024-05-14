import { InputType } from '@nestjs/graphql';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class OrdersInput extends FindManyDTO {}
