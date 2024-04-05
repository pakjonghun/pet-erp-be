import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from 'src/users/entities/user.entity';
import { ROLE_META_KEY } from '../constants';

export type GuardRoles = keyof typeof UserRoleEnum;

export const Roles = (roles: GuardRoles[]) => SetMetadata(ROLE_META_KEY, roles);
