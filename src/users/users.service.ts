import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserRepository } from './user.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}
  async create(createUserInput: CreateUserInput) {
    const password = createUserInput.password;
    const hashedPassword = await this.hashPassword(password);
    createUserInput.password = hashedPassword;
    return this.userRepository.create(createUserInput);
  }

  findAll() {
    return this.userRepository.findAll({});
  }

  findOne(_id: string) {
    return this.userRepository.findOne({ _id });
  }

  async update(updateInput: UpdateUserInput) {
    const password = updateInput.password;
    if (updateInput.password) {
      const hashedPassword = await this.hashPassword(password);
      updateInput.password = hashedPassword;
    }

    const { _id, ...body } = updateInput;
    return this.userRepository.update({ _id }, body);
  }

  async remove(id: string) {
    return this.userRepository.remove({ _id: id });
  }

  async validate(email: string, password: string) {
    const account = await this.userRepository.findOne({ email });
    if (!account) this.throwUnAuthorize();

    const isAuthorized = await bcrypt.compare(password, account.password);
    if (!isAuthorized) this.throwUnAuthorize();

    const { password: _, ...rest } = account;
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
