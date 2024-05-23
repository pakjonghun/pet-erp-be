import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDTO } from './dtos/create-user.input';
import { UpdateUserDTO } from './dtos/update-user.input';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';
import { FilterQuery } from 'mongoose';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(createUserInput: CreateUserDTO) {
    const isExistUser = await this.userRepository.exists({
      id: createUserInput.id,
    });
    if (isExistUser) throw new BadRequestException('이미 존재하는 계정입니다.');

    const password = createUserInput.password;
    const hashedPassword = await this.hashPassword(password);
    createUserInput.password = hashedPassword;
    const { id, role, createdAt } =
      await this.userRepository.create(createUserInput);
    return { id, role, createdAt };
  }

  findAll(filterQuery: FilterQuery<User>) {
    return this.userRepository.findAll(filterQuery);
  }

  findOne(id: string) {
    return this.userRepository.findOne({ id });
  }

  async update(updateInput: UpdateUserDTO) {
    const password = updateInput.password;
    if (updateInput.password) {
      const hashedPassword = await this.hashPassword(password);
      updateInput.password = hashedPassword;
    }

    const { id, ...body } = updateInput;
    return this.userRepository.update({ id }, body);
  }

  async remove(id: string) {
    const {
      id: userId,
      role,
      createdAt,
    } = await this.userRepository.remove({ id });
    return { id: userId, role, createdAt };
  }

  async validate(id: string, originPassword: string) {
    const account = await this.userRepository.findOne({ id });

    if (!account) {
      throw new NotFoundException(`${id}_로 계정 검색 실패`);
    }

    const { password, ...rest } = account;
    const isAuthorized = await bcrypt.compare(originPassword, password);
    if (!isAuthorized) {
      throw new UnauthorizedException(
        `받은 비밀번호 : ${originPassword},해쉬 비밀번호 : ${password} 비번 틀림`,
      );
    }

    return rest;
  }

  private throwUnAuthorize() {
    throw new UnauthorizedException('로그인이 실패했습니다.');
  }

  private async hashPassword(password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return hashedPassword;
  }
}
