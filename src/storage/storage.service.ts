import { Injectable } from '@nestjs/common';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { FilterQuery } from 'mongoose';
import { StorageRepository } from './storage.repository';

@Injectable()
export class StorageService {
  constructor(private readonly storageRepository: StorageRepository) {}

  create(createStorageInput: CreateStorageInput) {
    return 'This action adds a new storage';
  }

  findAll(filterQuery: FilterQuery<Storage>) {
    return `This action returns all storage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} storage`;
  }

  update(id: number, updateStorageInput: UpdateStorageInput) {
    return `This action updates a #${id} storage`;
  }

  remove(id: number) {
    return `This action removes a #${id} storage`;
  }
}
