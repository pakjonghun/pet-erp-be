import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { User } from 'src/users/entities/user.entity';
import { AUTH_COOKIE_KEY } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies[AUTH_COOKIE_KEY],
      ]),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: User) {
    return payload;
  }
}
