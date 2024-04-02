import { Controller, Post, UseGuards } from '@nestjs/common';
import { GetUser } from './decorators/user.decorator';
import { User } from 'src/users/entities/user.entity';
import { LocalAuthGuard } from './guards/local.guard';

@Controller('auth')
export class AuthController {
  @Post('')
  @UseGuards(LocalAuthGuard)
  async login(@GetUser() user: User) {
    return user;
  }
}
