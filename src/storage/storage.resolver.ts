import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StorageService } from './storage.service';
import { Storage } from './entities/storage.entity';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { StoragesInput } from './dto/storages.input';
import { StoragesOutput } from './dto/storages.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';

@Resolver(() => Storage)
export class StorageResolver {
  constructor(private readonly storageService: StorageService) {}

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Storage)
  createStorage(
    @Args('createStorageInput') createStorageInput: CreateStorageInput,
  ) {
    return this.storageService.create(createStorageInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => StoragesOutput, { name: 'storages' })
  storages(@Args('storagesInput') storagesInput: StoragesInput) {
    return this.storageService.findMany(storagesInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Storage)
  updateStorage(
    @Args('updateStorageInput') updateStorageInput: UpdateStorageInput,
  ) {
    return this.storageService.update(updateStorageInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => Storage)
  removeStorage(@Args('_id', { type: () => String }) id: string) {
    return this.storageService.remove(id);
  }
}
