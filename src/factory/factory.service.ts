import { ConflictException, Injectable } from '@nestjs/common';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoryRepository } from './factory.repository';
import { InjectModel } from '@nestjs/mongoose';
import { ProductOrder } from 'src/product-order/entities/product-order.entity';
import { FilterQuery, Model } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { ColumnOption } from 'src/client/types';
import { Factory, FactoryInterface } from './entities/factory.entity';
import { FactoriesInput } from './dto/factories.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';

@Injectable()
export class FactoryService {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    @InjectModel(ProductOrder.name)
    private readonly productOrderModel: Model<ProductOrder>,
    private readonly utilService: UtilService,
  ) {}

  async create(createFactoryInput: CreateFactoryInput) {
    await this.beforeCreate(createFactoryInput.name);
    return this.factoryRepository.create(createFactoryInput);
  }

  findMany({ keyword, skip, limit }: FactoriesInput) {
    const filterQuery: FilterQuery<Factory> = {
      name: { $regex: keyword, $options: 'i' },
    };
    return this.factoryRepository.findMany({
      filterQuery,
      skip,
      limit,
      order: OrderEnum.DESC,
    });
  }

  async update({ _id, ...body }: UpdateFactoryInput) {
    if (body.name) {
      await this.beforeUpdate({ _id, name: body.name });
    }

    return this.factoryRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const isFactoryUsedInOrder = await this.productOrderModel.exists({
      factory: { _id },
    });
    if (isFactoryUsedInOrder) {
      throw new ConflictException(
        `${_id} 해당 공장은 발주기록이 존재하므로 삭제할 수 없습니다.`,
      );
    }

    const result = await this.factoryRepository.remove({ _id });
    return result;
  }

  private async beforeCreate(name: string) {
    const isNameExist = await this.factoryRepository.exists({
      name,
    });
    if (isNameExist) this.throwDuplicated(name);
  }

  private async beforeUpdate({ _id, name }: { _id: string; name: string }) {
    const isNameExist = await this.factoryRepository.exists({
      _id: { $ne: _id },
      name,
    });
    if (isNameExist) this.throwDuplicated(name);
  }

  private throwDuplicated(name: string) {
    throw new ConflictException(`${name}은 이미 사용중인 공장 이름 입니다.`);
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<FactoryInterface>> = {
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
      await this.factoryRepository.objectToDocuments(objectList);
    this.utilService.checkDuplicatedField(documents, 'name');
    await this.factoryRepository.docUniqueCheck(documents, 'name');
    await this.factoryRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = this.factoryRepository.model
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
