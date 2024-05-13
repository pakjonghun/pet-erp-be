import { ConflictException, Injectable } from '@nestjs/common';
import { CreateStorageInput } from './dto/create-storage.input';
import { UpdateStorageInput } from './dto/update-storage.input';
import { FilterQuery } from 'mongoose';
import { StorageRepository } from './storage.repository';
import { Storage, StorageInterface } from './entities/storage.entity';
import { ColumnOption } from 'src/client/types';
import { UtilService } from 'src/common/services/util.service';
import * as ExcelJS from 'exceljs';

@Injectable()
export class StorageService {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly utilService: UtilService,
  ) {}

  async create(createStorageInput: CreateStorageInput) {
    await this.beforeCreateOrUpdate(createStorageInput.name);
    return this.storageRepository.create(createStorageInput);
  }

  findAll(filterQuery: FilterQuery<Storage>) {
    return this.findAll(filterQuery);
  }

  async update({ _id, ...updateStorageInput }: UpdateStorageInput) {
    if (updateStorageInput.name) {
      await this.beforeCreateOrUpdate(updateStorageInput.name);
    }

    return this.storageRepository.update({ _id }, updateStorageInput);
  }

  remove(_id: string) {
    //fix: 조건을 보고 지워야함 무조건 지우는것 안됨! 재고가 있으면.. 지우면 안된다 이런식으로 재고 작업하면서 추가 작업 필요
    return this.storageRepository.remove({ _id });
  }

  private async beforeCreateOrUpdate(name: string) {
    const isNameExist = await this.storageRepository.exists({ name });

    if (isNameExist) {
      throw new ConflictException(`${name} 은 이미 사용중인 창고 이름입니다.`);
    }
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
      .populate({
        path: 'category',
        select: ['name'],
      })
      .select('-_id -createdAt -updatedAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: '이름', key: 'name', width: 70 },
      { header: '연락처', key: 'phoneNumber', width: 40 },
      { header: '주소', key: 'address', width: 40 },
      { header: '비고', key: 'note', width: 40 },
    ];

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
