import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { GetUser } from '../common/decorators/user.decorator';
import { AuthRoleEnum, User } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { Roles } from 'src/common/decorators/role.decorator';
import { LocalAuthGuard } from './guards/local.guard';

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
    await this.authService.login(user, res);
  }

  @Post('logout')
  @Roles([AuthRoleEnum.ANY])
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
  }
}
