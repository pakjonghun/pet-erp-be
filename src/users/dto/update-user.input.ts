import { CreateUserDTO } from './create-user.input';
import { InputType, OmitType, PartialType } from '@nestjs/graphql';

@InputType()
export class UpdateUserDTO extends PartialType(CreateUserDTO) {}

@InputType()
export class UpdateProfileDTO extends PartialType(
  OmitType(CreateUserDTO, ['id']),
) {}
