import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { StorageService } from './storage.service';
import { Storage } from './entities/storage.entity';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { StockStorageOutput } from './dto/stock-storage.output';

@Resolver(() => Storage)
export class StorageResolver {
  constructor(private readonly storageService: StorageService) {}

  @Mutation(() => Storage)
  createStorage(
    @Args('createStorageInput') createStorageInput: CreateStorageInput,
  ) {
    return this.storageService.create(createStorageInput);
  }

  @Query(() => [Storage], { name: 'storages' })
  storages(@Args('storageName') storageName: string) {
    return this.storageService.findAll({
      name: { $regex: storageName, $options: 'i' },
    });
  }

  @Mutation(() => Storage)
  updateStorage(
    @Args('updateStorageInput') updateStorageInput: UpdateStorageInput,
  ) {
    return this.storageService.update(updateStorageInput);
  }

  @Mutation(() => Storage)
  removeStorage(@Args('_id', { type: () => String }) id: string) {
    return this.storageService.remove(id);
  }

  //fix:위치별 페이지 없어져서 필요 없을 수 있음 일단 삭제 대기
  @Query(() => [StockStorageOutput])
  stockStorages() {
    return this.storageService.findAll({});
  }
}
