import { Module } from '@nestjs/common';
import { SubsidiaryService } from './subsidiary.service';
import { SubsidiaryResolver } from './subsidiary.resolver';

@Module({
  providers: [SubsidiaryResolver, SubsidiaryService],
})
export class SubsidiaryModule {}
