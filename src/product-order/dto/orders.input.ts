import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString } from 'class-validator';
import { FindManyDTO } from 'src/common/dtos/find-many.input';

@InputType()
export class OrdersInput extends FindManyDTO {}
