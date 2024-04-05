import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from 'src/users/entities/user.entity';
import { ROLE_META_KEY } from '../../auth/constants';

export const Roles = (roles: UserRoleEnum[]) =>
  SetMetadata(ROLE_META_KEY, roles);
