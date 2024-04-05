import { Controller, Post, Res, UseGuards } from '@nestjs/common';
import { GetUser } from '../common/decorators/user.decorator';
import { User, UserRoleEnum } from 'src/users/entities/user.entity';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { Roles } from 'src/common/decorators/role.decorator';
import { LocalAuthGuard } from './guards/local.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(
    @GetUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('user', user);
    await this.authService.login(user, res);
  }

  @Post('logout')
  @Roles([UserRoleEnum.ANY])
  async logout(@Res({ passthrough: true }) res: Response) {
    await this.authService.logout(res);
  }
}
