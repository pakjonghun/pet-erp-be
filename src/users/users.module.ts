import { DatabaseModule } from './../common/database/database.module';
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { UserRepository } from './user.repository';
import { User, userSchema } from './entities/user.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([{ name: User.name, schema: userSchema }]),
  ],
  providers: [UsersResolver, UsersService, UserRepository],
})
export class UsersModule {}
