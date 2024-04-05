import { Module } from '@nestjs/common';
import { LogService } from './log.service';
import { LogResolver } from './log.resolver';
import { LogRepository } from './log.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { Log, LogSchema } from './entities/log.entity';

@Module({
  imports: [DatabaseModule.forFeature([{ name: Log.name, schema: LogSchema }])],
  providers: [LogResolver, LogService, LogRepository],
  exports: [LogService],
})
export class LogModule {}
