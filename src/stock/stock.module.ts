import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockResolver } from './stock.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { StorageSchema } from 'src/storage/entities/storage.entity';

@Module({
  providers: [StockResolver, StockService],
})
export class StockModule {}
