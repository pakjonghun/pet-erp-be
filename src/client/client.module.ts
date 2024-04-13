import { Module, forwardRef } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientResolver } from './client.resolver';
import { DatabaseModule } from 'src/common/database/database.module';
import { Client, clientSchema } from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { AppModule } from 'src/app.module';

@Module({
  exports: [ClientService],
  imports: [
    forwardRef(() => AppModule),
    DatabaseModule.forFeature([{ name: Client.name, schema: clientSchema }]),
  ],
  providers: [ClientResolver, ClientService, ClientRepository],
})
export class ClientModule {}
