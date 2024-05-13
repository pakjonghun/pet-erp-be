import { Module } from '@nestjs/common';
import { FactoryService } from './factory.service';
import { FactoryResolver } from './factory.resolver';
import { FactoryRepository } from './factory.repository';
import { DatabaseModule } from 'src/common/database/database.module';
import { Factory, FactorySchema } from './entities/factory.entity';

@Module({
  imports: [
    DatabaseModule.forFeature([
      {
        name: Factory.name,
        schema: FactorySchema,
      },
    ]),
  ],
  providers: [FactoryResolver, FactoryService, FactoryRepository],
})
export class FactoryModule {}
