import { Injectable } from '@nestjs/common';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { ObjectId } from 'mongodb';

@Injectable()
export class SubsidiaryService {
  create(createSubsidiaryInput: CreateSubsidiaryInput) {
    return 'This action adds a new subsidiary';
  }

  findAll() {
    return `This action returns all subsidiary`;
  }

  findOne(id: number) {
    return `This action returns a #${id} subsidiary`;
  }

  update(id: ObjectId, updateSubsidiaryInput: UpdateSubsidiaryInput) {
    return `This action updates a #${id} subsidiary`;
  }

  remove(id: number) {
    return `This action removes a #${id} subsidiary`;
  }
}
