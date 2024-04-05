import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDTO } from './dto/create.user.dto';
import { UpdateUserDTO } from './dto/update.user.dto';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';

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
    const { id, role } = await this.userRepository.create(createUserInput);
    return { id, role };
  }

  findAll() {
    return this.userRepository.findAll({});
  }

  findOne(_id: string) {
    return this.userRepository.findOne({ _id });
  }

  async update(updateInput: UpdateUserDTO) {
    const password = updateInput.password;
    if (updateInput.password) {
      const hashedPassword = await this.hashPassword(password);
      updateInput.password = hashedPassword;
    }

    const { _id, ...body } = updateInput;
    return this.userRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    return this.userRepository.remove({ _id });
  }

  async validate(id: string, originPassword: string) {
    const account = await this.userRepository.findOne({ id });
    if (!account) this.throwUnAuthorize();

    const { password, ...rest } = account;
    const isAuthorized = await bcrypt.compare(originPassword, password);
    if (!isAuthorized) this.throwUnAuthorize();

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
