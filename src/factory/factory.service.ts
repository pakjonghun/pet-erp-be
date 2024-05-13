import { Injectable } from '@nestjs/common';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoryRepository } from './factory.repository';

@Injectable()
export class FactoryService {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  create(createFactoryInput: CreateFactoryInput) {
    return 'This action adds a new factory';
  }

  findAll() {
    return this.factoryRepository.findAll({});
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
