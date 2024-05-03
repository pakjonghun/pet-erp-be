import { Injectable } from '@nestjs/common';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';

@Injectable()
export class FactoryService {
  create(createFactoryInput: CreateFactoryInput) {
    return 'This action adds a new factory';
  }

  findAll() {
    return `This action returns all factory`;
  }

  findOne(id: number) {
    return `This action returns a #${id} factory`;
  }

  update(id: number, updateFactoryInput: UpdateFactoryInput) {
    return `This action updates a #${id} factory`;
  }

  remove(id: number) {
    return `This action removes a #${id} factory`;
  }
}
