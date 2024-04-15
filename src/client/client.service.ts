import { Injectable } from '@nestjs/common';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import { ClientInterface, ClientType } from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { UtilService } from 'src/common/services/util.service';
import { ColumnOption } from './types';
import * as ExcelJS from 'exceljs';
import { SaleService } from 'src/sale/sale.service';
import { TopClientInput } from './dtos/top-client.input';

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly utilService: UtilService,
    private readonly saleService: SaleService,
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
    const colToField: Record<number, ColumnOption<ClientInterface>> = {
      1: { fieldName: 'name' },
      2: { fieldName: 'businessName' },
      3: { fieldName: 'businessNumber' },
      4: { fieldName: 'code' },
      5: { fieldName: 'feeRate' },
      6: {
        fieldName: 'clientType',
        transform: (value) =>
          value == '도매몰' ? ClientType.wholeSale : ClientType.platform,
      },
      7: { fieldName: 'payDate' },
      8: { fieldName: 'manager' },
      9: { fieldName: 'managerTel' },
      10: {
        fieldName: 'inActive',
        transform: (value) => value === '거래중',
      },
    };

    const documents = await this.clientRepository.excelToDocuments(
      worksheet,
      colToField,
      3,
    );
    this.utilService.checkDuplicatedField(documents, 'code');
    await this.clientRepository.checkUnique(documents, 'code');
    await this.clientRepository.bulkWrite(documents);
  }

  topClientList(topClientInput: TopClientInput) {
    return this.saleService.topSaleBy('mallId', topClientInput);
  }
}
