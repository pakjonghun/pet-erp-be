import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthRoleEnum, UserRoleEnum } from 'src/users/entities/user.entity';
import { ROLE_META_KEY } from '../constants';
import {
  FORBIDDEN_ERROR,
  UNAUTHORIZE_ERROR,
} from 'src/common/validations/constants';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  getRequest(context: ExecutionContext): Request {
    const isHttp = context.getType() === 'http';
    return isHttp
      ? context.switchToHttp().getRequest<Request>()
      : GqlExecutionContext.create(context).getContext().req;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const roles = this.reflector.get<AuthRoleEnum[]>(
      ROLE_META_KEY,
      context.getHandler(),
    );

    console.log('user', user, roles);

    switch (true) {
      case err:
        throw new UnauthorizedException(UNAUTHORIZE_ERROR);

      case roles == null:
        return user;

      case roles.includes(AuthRoleEnum.ANY):
        if (!!user) return user;
        else throw new UnauthorizedException(UNAUTHORIZE_ERROR);

      case !user:
        throw new UnauthorizedException(UNAUTHORIZE_ERROR);

      default:
        if (roles.includes(user.role)) return user;
        else throw new ForbiddenException(FORBIDDEN_ERROR);
    }
  }

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<UserRoleEnum[]>(
      ROLE_META_KEY,
      context.getHandler(),
    );

    if (roles == null) return true;

    return super.canActivate(context);
  }
}
