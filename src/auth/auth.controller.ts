import {
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorators/user.decorator';
import {
  AuthRoleEnum,
  User,
  UserRoleEnum,
} from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/role.decorator';
import { LocalAuthGuard } from './guards/local.guard';
import * as requestIp from 'request-ip';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @GetUser() user: User,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = requestIp.getClientIp(req);
    const canAllAccess = user.role.includes(UserRoleEnum.ADMIN_ACCESS);

    if (!canAllAccess) {
      throw new UnauthorizedException(`당신의 아이피는 ${clientIp} 입니다..`);
    }

    await this.authService.login(user, res);
  }

  @Post('logout')
  @Roles([AuthRoleEnum.ANY])
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
  }
}
