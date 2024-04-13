import { Injectable } from '@nestjs/common';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { ClientInterface } from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { UtilService } from 'src/common/services/util.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly utilService: UtilService,
  ) {}

  create(createClientInput: CreateClientInput) {
    return this.clientRepository.create(createClientInput);
  }

  findAll() {
    return this.clientRepository.findAll({});
  }

  findOne(_id: string) {
    return this.clientRepository.findOne({ _id });
  }

  update({ _id, ...body }: UpdateClientInput) {
    return this.clientRepository.update({ _id }, body);
  }

  remove(_id: string) {
    return this.clientRepository.remove({ _id });
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, Partial<keyof ClientInterface>> = {};
    const documents = await this.clientRepository.excelToDocuments(
      worksheet,
      colToField,
      4,
    );
    this.utilService.checkDuplicatedField(documents, 'code');
    await this.clientRepository.checkUnique(documents, 'code');
    await this.clientRepository.bulkWrite(documents);
  }
}
