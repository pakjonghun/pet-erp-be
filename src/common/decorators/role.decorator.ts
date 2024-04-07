import { SetMetadata } from '@nestjs/common';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { ROLE_META_KEY } from '../../auth/constants';

export const Roles = (roles: AuthRoleEnum[]) =>
  SetMetadata(ROLE_META_KEY, roles);
