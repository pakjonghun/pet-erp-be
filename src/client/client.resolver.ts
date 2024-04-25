import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ClientService } from './client.service';
import { Client } from './entities/client.entity';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import { TopClientOutput } from './dtos/top-client.output';
import { TopClientInput } from './dtos/top-client.input';
import { ClientsOutput } from './dtos/clients.output';
import { ClientsInput } from './dtos/clients.input';

@Resolver(() => Client)
export class ClientResolver {
  constructor(private readonly clientService: ClientService) {}

  @Mutation(() => Client)
  createClient(
    @Args('createClientInput') createClientInput: CreateClientInput,
  ) {
    return this.clientService.create(createClientInput);
  }

  @Query(() => [Client], { name: 'client' })
  findAll() {
    return this.clientService.findAll();
  }

  @Query(() => ClientsOutput)
  clients(@Args('clientsInput') clientsInput: ClientsInput) {
    return this.clientService.findMany(clientsInput);
  }

  @Query(() => Client, { name: 'client' })
  findOne(@Args('_id') _id: string) {
    return this.clientService.findOne(_id);
  }

  @Mutation(() => Client)
  updateClient(
    @Args('updateClientInput') updateClientInput: UpdateClientInput,
  ) {
    return this.clientService.update(updateClientInput);
  }

  @Mutation(() => Client)
  async removeClient(@Args('_id') _id: string) {
    const result = await this.clientService.remove(_id);
    return result;
  }

  @Query(() => TopClientOutput)
  async topClients(@Args('topClientInput') topClientInput: TopClientInput) {
    const result = await this.clientService.topClientList(topClientInput);
    return result[0];
  }
}
