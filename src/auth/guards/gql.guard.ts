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
import { Observable } from 'rxjs';
import { User, UserRoleEnum } from 'src/users/entities/user.entity';
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

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<UserRoleEnum[]>(
      ROLE_META_KEY,
      context.getHandler(),
    );

    const isHttp = context.getType() === 'http';
    const user: User = isHttp
      ? context.switchToHttp().getRequest<Request>().user
      : GqlExecutionContext.create(context).getContext().req.user;

    switch (true) {
      case roles == null:
        console.log('role is null');
        return true;

      case roles.includes(UserRoleEnum.ANY):
        console.log('any');
        if (!!user) return true;
        else throw new UnauthorizedException(UNAUTHORIZE_ERROR);

      case user == null:
        throw new UnauthorizedException(UNAUTHORIZE_ERROR);

      default:
        console.log('role');
        if (roles.includes(user.role)) return true;
        else throw new ForbiddenException(FORBIDDEN_ERROR);
    }
  }
}
