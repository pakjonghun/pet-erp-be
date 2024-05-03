import { Injectable } from '@nestjs/common';
import { CreateMoveInput } from './dto/create-move.input';
import { UpdateMoveInput } from './dto/update-move.input';

@Injectable()
export class MoveService {
  create(createMoveInput: CreateMoveInput) {
    return 'This action adds a new move';
  }

  findAll() {
    return `This action returns all move`;
  }

  findOne(id: number) {
    return `This action returns a #${id} move`;
  }

  update(id: number, updateMoveInput: UpdateMoveInput) {
    return `This action updates a #${id} move`;
  }

  remove(id: number) {
    return `This action removes a #${id} move`;
  }
}
