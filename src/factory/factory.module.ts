import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryResolver } from './factory.resolver';

@Module({
  providers: [FactoryResolver, FactoryService],
})
export class FactoryModule {}
