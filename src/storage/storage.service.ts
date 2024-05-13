import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { FilterQuery } from 'mongoose';
import { UtilService } from 'src/common/services/util.service';
import { ColumnOption } from 'src/client/types';
import { StoragesInput } from './dto/storages.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';
import { StorageRepository } from './storage.repository';
import { Storage, StorageInterface } from './entities/storage.entity';

@Injectable()
export class StorageService {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly utilService: UtilService,
  ) {}

  async create(createFactoryInput: CreateStorageInput) {
    await this.beforeCreate(createFactoryInput.name);
    return this.storageRepository.create(createFactoryInput);
  }

  findMany({ keyword, skip, limit }: StoragesInput) {
    const filterQuery: FilterQuery<Storage> = {
      name: { $regex: keyword, $options: 'i' },
    };
    return this.storageRepository.findMany({
      filterQuery,
      skip,
      limit,
      order: OrderEnum.DESC,
    });
  }

  async update({ _id, ...body }: UpdateStorageInput) {
    if (body.name) {
      await this.beforeUpdate({ _id, name: body.name });
    }

    return this.storageRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    //fixme:stock 확인 필요

    const result = await this.storageRepository.remove({ _id });
    return result;
  }

  private async beforeCreate(name: string) {
    const isNameExist = await this.storageRepository.exists({
      name,
    });
    if (isNameExist) this.throwDuplicated(name);
  }

  private async beforeUpdate({ _id, name }: { _id: string; name: string }) {
    const isNameExist = await this.storageRepository.exists({
      _id: { $ne: _id },
      name,
    });
    if (isNameExist) this.throwDuplicated(name);
  }

  private throwDuplicated(name: string) {
    throw new ConflictException(`${name}은 이미 사용중인 공장 이름 입니다.`);
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<StorageInterface>> = {
      1: {
        fieldName: 'name',
      },
      2: {
        fieldName: 'phoneNumber',
      },
      3: {
        fieldName: 'address',
      },
      4: {
        fieldName: 'note',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 1);
    const documents =
      await this.storageRepository.objectToDocuments(objectList);
    this.utilService.checkDuplicatedField(documents, 'name');
    await this.storageRepository.docUniqueCheck(documents, 'name');
    await this.storageRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = this.storageRepository.model
      .find()
      .select('-_id -createdAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: '이름', key: 'name', width: 70 },
      { header: '연락처', key: 'phoneNumber', width: 40 },
      { header: '주소', key: 'address', width: 40 },
      { header: '비고', key: 'note', width: 40 },
    ];

    for await (const doc of allData) {
      worksheet.addRow(doc.toObject());
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
