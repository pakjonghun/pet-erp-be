import { DatabaseModule } from './../common/database/database.module';
import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserRepository } from './user.repository';
import { User, userSchema } from './entities/user.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  exports: [UsersService],
  imports: [
    DatabaseModule.forFeature([{ name: User.name, schema: userSchema }]),
    forwardRef(() => AuthModule),
  ],
  providers: [UsersResolver, UsersService, UserRepository],
})
export class UsersModule {}
