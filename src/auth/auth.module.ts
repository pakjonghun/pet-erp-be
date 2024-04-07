import { Module, forwardRef } from '@nestjs/common';
import { UsersModule } from 'src/users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions: { expiresIn: Number(config.get('JWT_EXPIRATION')) },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [LocalStrategy, AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
