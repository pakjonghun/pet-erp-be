import { Module, forwardRef } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageResolver } from './storage.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Storage, StorageSchema } from './entities/storage.entity';
import { StorageRepository } from './storage.repository';
import { AppModule } from 'src/app.module';

@Module({
  imports: [
    forwardRef(() => AppModule),
    DatabaseModule.forFeature([
      {
        name: Storage.name,
        schema: StorageSchema,
      },
    ]),
  ],
  providers: [StorageResolver, StorageService, StorageRepository],
  exports: [StorageService],
})
export class StorageModule {}
