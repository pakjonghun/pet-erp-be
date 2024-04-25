import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import {
  ClientInterface,
  ClientType,
  ClientTypeToHangle,
  HangleToClientType,
} from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { UtilService } from 'src/common/services/util.service';
import { ColumnOption } from './types';
import { SaleService } from 'src/sale/sale.service';
import { TopClientInput } from './dtos/top-client.input';
import { ClientsInput } from './dtos/clients.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ClientService {
  constructor(
    private readonly clientRepository: ClientRepository,
    private readonly utilService: UtilService,
    private readonly saleService: SaleService,
  ) {}

  async create(createClientInput: CreateClientInput) {
    const isCodeExist = await this.clientRepository.exists({
      code: createClientInput.code,
    });

    if (isCodeExist) {
      throw new BadRequestException(
        `${createClientInput.code}는 이미 사용중인 코드 입니다.`,
      );
    }

    const result = await this.clientRepository.create(createClientInput);
    return result;
  }

  findAll() {
    return this.clientRepository.findAll({});
  }

  findMany(query: ClientsInput) {
    return this.clientRepository.findMany({
      filterQuery: {
        name: { $regex: query.keyword, $options: 'i' },
      },
      skip: query.skip,
      limit: query.limit,
      order: OrderEnum.DESC,
    });
  }

  findOne(_id: string) {
    return this.clientRepository.findOne({ _id });
  }

  update({ _id, ...body }: UpdateClientInput) {
    return this.clientRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const result = await this.clientRepository.remove({ _id });
    return result;
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
        transform: (value) => {
          if (typeof value === 'string') {
            const lowerKey =
              value.toLowerCase() as keyof typeof HangleToClientType;
            const clientType = HangleToClientType[lowerKey];
            if (!clientType) {
              throw new BadRequestException(
                `${value}는 올바른 거래처 타입이 아닙니다.`,
              );
            }

            return clientType;
          }
        },
      },
      7: { fieldName: 'payDate' },
      8: { fieldName: 'manager' },
      9: { fieldName: 'managerTel' },
      10: {
        fieldName: 'inActive',
        transform: (value) => {
          const valueType = typeof value;
          if (valueType === 'string') {
            if (value === '거래중') return true;
            if (value === '거래종료') return false;

            throw new BadRequestException(
              `${value} 는 올바른 거래여부가 아닙니다.`,
            );
          }

          if (valueType == 'boolean') {
            return value;
          }
          return true;
        },
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
      { header: '이름', key: 'name', width: 40 },
      { header: '상호(사업자등록증)', key: 'businessName', width: 70 },
      { header: '거래처 사업자번호', key: 'businessNumber', width: 50 },
      { header: '코드', key: 'code', width: 40 },
      { header: '수수료율', key: 'feeRate', width: 40 },
      { header: '분류', key: 'clientType', width: 40 },
      { header: '결제일', key: 'payDate', width: 40 },
      { header: '담당자', key: 'manager', width: 40 },
      { header: '연락처', key: 'managerTel', width: 40 },
      { header: '거래여부', key: 'inActive', width: 40 },
    ];

    for await (const doc of allData) {
      const object = doc.toObject();
      const handleClientType = ClientTypeToHangle[
        object.clientType
      ] as ClientType;

      object.clientType = handleClientType;

      worksheet.addRow(object);
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
