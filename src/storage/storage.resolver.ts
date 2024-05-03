import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StorageService } from './storage.service';
import { Storage } from './entities/storage.entity';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';

@Resolver(() => Storage)
export class StorageResolver {
  constructor(private readonly storageService: StorageService) {}

  @Mutation(() => Storage)
  createStorage(@Args('createStorageInput') createStorageInput: CreateStorageInput) {
    return this.storageService.create(createStorageInput);
  }

  @Query(() => [Storage], { name: 'storage' })
  findAll() {
    return this.storageService.findAll();
  }

  @Query(() => Storage, { name: 'storage' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.storageService.findOne(id);
  }

  @Mutation(() => Storage)
  updateStorage(@Args('updateStorageInput') updateStorageInput: UpdateStorageInput) {
    return this.storageService.update(updateStorageInput.id, updateStorageInput);
  }

  @Mutation(() => Storage)
  removeStorage(@Args('id', { type: () => Int }) id: number) {
    return this.storageService.remove(id);
  }
}
