import { SetMetadata } from '@nestjs/common';
import { LOG_META_KEY } from '../../auth/constants';
import { Log } from 'src/log/entities/log.entity';

export type LogMetaData = Pick<Log, 'description' | 'logType'>;

export const LogData = (logData: LogMetaData) =>
  SetMetadata(LOG_META_KEY, logData);
