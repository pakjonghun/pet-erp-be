import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClientInput } from './dtos/create-client.input';
import { UpdateClientInput } from './dtos/update-client.input';
import {
  Client,
  ClientInterface,
  ClientType,
  ClientTypeToHangle,
  HangleToClientType,
} from './entities/client.entity';
import { ClientRepository } from './client.repository';
import { UtilService } from 'src/util/util.service';
import { ColumnOption } from './types';
import { SaleService } from 'src/sale/sale.service';
import { ClientsInput } from './dtos/clients.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Sale } from 'src/sale/entities/sale.entity';

@Injectable()
export class ClientService {
  constructor(
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    private readonly clientRepository: ClientRepository,
    private readonly utilService: UtilService,
    private readonly saleService: SaleService,
  ) {}

  private async beforeCreate(input: CreateClientInput | UpdateClientInput) {
    if (input.code) {
      const isCodeExist = await this.clientRepository.exists({
        code: input.code,
      });

      if (isCodeExist) {
        throw new BadRequestException(
          `${input.code}는 이미 사용중인 코드 입니다.`,
        );
      }
    }

    if (input.name) {
      const isNameExist = await this.clientRepository.exists({
        code: input.name,
      });

      if (isNameExist) {
        throw new BadRequestException(
          `${input.name}는 이미 사용중인 이름 입니다.`,
        );
      }
    }
  }

  private async beforeUpdate(input: UpdateClientInput) {
    if (input.code) {
      throw new BadRequestException('거래처 코드는 수정할 수 없습니다.');
    }

    if (input.name) {
      const isSaleRecordExist = await this.saleModel.exists({
        mallId: input.name,
      });

      if (isSaleRecordExist) {
        throw new BadRequestException(
          `${input.name} 판매기록이 있는 제품이름 입니다. 사방넷 전산과 동기화를 위해 이름을 수정할 수 없습니다.`,
        );
      }

      const isNameExist = await this.clientRepository.exists({
        _id: { $ne: input._id },
        name: input.name,
      });

      if (isNameExist) {
        throw new BadRequestException(
          `${input.name}는 이미 사용중인 이름 입니다.`,
        );
      }
    }

    const updateTarget = await this.clientRepository.model.find({
      _id: input._id,
    });
    if (!updateTarget) {
      throw new BadRequestException('해당 거래처를 찾을 수 없습니다.');
    }
  }

  async create(createClientInput: CreateClientInput) {
    await this.beforeCreate(createClientInput);
    const result = await this.clientRepository.create(createClientInput);
    return result;
  }

  findAll() {
    return this.clientRepository.findAll({});
  }

  findMany(query: ClientsInput) {
    const filterQuery: FilterQuery<Client> = {
      name: {
        $regex: this.utilService.escapeRegex(query.keyword),
        $options: 'i',
      },
    };

    if (query.clientType) {
      filterQuery.clientType = { $in: query.clientType };
    }

    return this.clientRepository.findMany({
      filterQuery,
      skip: query.skip,
      limit: query.limit,
      order: OrderEnum.DESC,
    });
  }

  findOne(_id: string) {
    return this.clientRepository.findOne({ _id });
  }

  async update({ _id, ...body }: UpdateClientInput) {
    await this.beforeUpdate({ ...body, _id });
    return this.clientRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const deleteTarget = await this.clientRepository.findOne({ _id });
    if (!deleteTarget) {
      throw new BadRequestException('해당 거래처를 찾을 수 없습니다.');
    }

    const hasSaleRecord = await this.saleModel.exists({
      mallId: deleteTarget.name,
    });

    if (hasSaleRecord) {
      throw new BadRequestException(
        '판매 기록이 있는 거래처는 삭제할 수 없습니다.',
      );
    }

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
    await this.clientRepository.docUniqueCheck(documents, 'code');
    this.utilService.checkDuplicatedField(documents, 'name');
    await this.clientRepository.docUniqueCheck(documents, 'name');
    await this.clientRepository.bulkWrite(documents);
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

  async totalSaleBy(range: FindDateInput, groupId?: string) {
    const prevRange = this.utilService.getBeforeDate(range);

    const current = await this.saleService.totalSale(range, groupId, 'mallId');
    const previous = await this.saleService.totalSale(
      prevRange,
      groupId,
      'mallId',
    );

    return { current, previous };
  }
}
