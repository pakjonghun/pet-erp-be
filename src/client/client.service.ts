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

  async downloadExcel() {
    const allData = this.clientRepository.model
      .find()
      .select('-_id -createdAt -updatedAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: 'code', key: 'code', width: 40 },
      { header: 'name', key: 'name', width: 40 },
      { header: 'feeRate', key: 'feeRate', width: 40 },
      { header: 'clientType', key: 'clientType', width: 40 },
      { header: 'businessName', key: 'businessName', width: 70 },
      { header: 'businessNumber', key: 'businessNumber', width: 50 },
      { header: 'payDate', key: 'payDate', width: 40 },
      { header: 'manager', key: 'manager', width: 40 },
      { header: 'managerTel', key: 'managerTel', width: 40 },
      { header: 'inActive', key: 'inActive', width: 40 },
    ];

    for await (const doc of allData) {
      const object = doc.toObject();
      worksheet.addRow(object);
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
