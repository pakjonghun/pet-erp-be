import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { UserRepository } from './user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}
  create(createUserInput: CreateUserInput) {
    return this.userRepository.create(createUserInput);
  }

  findAll() {
    return this.userRepository.findAll({});
  }

  findOne(_id: string) {
    return this.userRepository.findOne({ _id });
  }

  update({ _id, ...body }: UpdateUserInput) {
    return this.userRepository.update({ _id }, body);
  }

  remove(id: string) {
    return this.userRepository.remove({ _id: id });
  }
}
