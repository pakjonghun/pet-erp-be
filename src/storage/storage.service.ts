import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { FilterQuery } from 'mongoose';
import { StorageRepository } from './storage.repository';
import { Storage } from './entities/storage.entity';

@Injectable()
export class StorageService {
  constructor(private readonly storageRepository: StorageRepository) {}

  async create(createStorageInput: CreateStorageInput) {
    await this.beforeCreateOrUpdate(createStorageInput.name);
    return this.storageRepository.create(createStorageInput);
  }

  findAll(filterQuery: FilterQuery<Storage>) {
    return this.findAll(filterQuery);
  }

  async update({ _id, ...updateStorageInput }: UpdateStorageInput) {
    if (updateStorageInput.name) {
      await this.beforeCreateOrUpdate(updateStorageInput.name);
    }

    return this.storageRepository.update({ _id }, updateStorageInput);
  }

  remove(_id: string) {
    //fix: 조건을 보고 지워야함 무조건 지우는것 안됨! 재고가 있으면.. 지우면 안된다 이런식으로 재고 작업하면서 추가 작업 필요
    return this.storageRepository.remove({ _id });
  }

  private async beforeCreateOrUpdate(name: string) {
    const isNameExist = await this.storageRepository.exists({ name });

    if (isNameExist) {
      throw new ConflictException(`${name} 은 이미 사용중인 창고 이름입니다.`);
    }
  }
}
