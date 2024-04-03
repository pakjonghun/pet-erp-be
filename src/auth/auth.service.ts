import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { User } from 'src/users/entities/user.entity';
import * as dayjs from 'dayjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(user: User, res: Response) {
    const payload = {
      email: user.email,
      _id: user._id,
    };
    const token = await this.jwtService.signAsync(payload);

    const expiration = this.config.get('JWT_EXPIRATION');
    const expires = dayjs().add(Number(expiration), 'second').toDate();
    res.cookie('Authentication', token, {
      expires,
    });
  }
}
