import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  forwardRef,
} from '@nestjs/common';
import { ColumnOption } from 'src/client/types';
import { UtilService } from 'src/util/util.service';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';
import { SubsidiaryCategoryRepository } from './subsidiary-category.repository';
import { CreateSubsidiaryCategoryInput } from './dto/create-subsidiary-category.input';
import { UpdateSubsidiaryCategoryInput } from './dto/update-subsidiary-category.input';
import {
  SubsidiaryCategory,
  SubsidiaryCategoryInterface,
} from './entities/subsidiary-category.entity';
import { SubsidiaryCategoriesInput } from './dto/subsidiary-categories.input';
import { FilterQuery } from 'mongoose';
import { SubsidiaryService } from 'src/subsidiary/subsidiary.service';

@Injectable()
export class SubsidiaryCategoryService {
  constructor(
    private readonly utilService: UtilService,
    private readonly subsidiaryCategoryRepository: SubsidiaryCategoryRepository,
    @Inject(forwardRef(() => SubsidiaryService))
    private readonly subsidiaryService: SubsidiaryService,
  ) {}

  async findOne(filterQuery: FilterQuery<SubsidiaryCategory>) {
    return this.subsidiaryCategoryRepository.findOne(filterQuery);
  }

  async create(createSubsidiaryInput: CreateSubsidiaryCategoryInput) {
    const createBody = await this.beforeCreateOrUpdate(createSubsidiaryInput);
    if (!this.isCreateInput(createBody)) return;
    return this.subsidiaryCategoryRepository.create(createBody);
  }

  findMany({ keyword, ...query }: SubsidiaryCategoriesInput) {
    return this.subsidiaryCategoryRepository.findMany({
      ...query,
      order: OrderEnum.DESC,
      sort: 'createdAt',
      filterQuery: {
        name: { $regex: keyword, $options: 'i' },
      },
    });
  }

  async update(updateSubsidiaryInput: UpdateSubsidiaryCategoryInput) {
    const updateBody = await this.beforeCreateOrUpdate(updateSubsidiaryInput);
    if (this.isUpdateInput(updateBody)) {
      const { _id, ...body } = updateBody;
      return this.subsidiaryCategoryRepository.update({ _id }, body);
    }
  }

  async remove(_id: string) {
    const isUsedItem = await this.subsidiaryService.exists({ category: _id });
    if (isUsedItem) {
      throw new ConflictException(
        `${_id}부자재 분류는 사용중인 부자재 분류 입니다 삭제할 수 없습니다.`,
      );
    }

    return this.subsidiaryCategoryRepository.remove({ _id });
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<
      number,
      ColumnOption<SubsidiaryCategoryInterface>
    > = {
      1: {
        fieldName: 'name',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 1);
    const newObjectList = [];

    for await (const object of objectList) {
      const createBody = await this.beforeCreateOrUpdate(object);
      newObjectList.push(createBody);
    }

    const documents =
      await this.subsidiaryCategoryRepository.objectToDocuments(newObjectList);
    await this.subsidiaryCategoryRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = this.subsidiaryCategoryRepository.model
      .find()
      .select('-_id -createdAt -updatedAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = [{ header: '이름', key: 'name', width: 50 }];

    for await (const doc of allData) {
      const object = doc.toObject();
      worksheet.addRow(object);
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private isUpdateInput(
    updateInput: any,
  ): updateInput is UpdateSubsidiaryCategoryInput {
    return '_id' in updateInput;
  }

  private isCreateInput(
    createInput: any,
  ): createInput is CreateSubsidiaryCategoryInput {
    return !('_id' in createInput);
  }

  private async beforeCreateOrUpdate(
    input: CreateSubsidiaryCategoryInput | UpdateSubsidiaryCategoryInput,
  ) {
    const isExistName = await this.subsidiaryCategoryRepository.exists({
      name: input.name,
    });
    if (isExistName) {
      throw new BadRequestException(
        `${input.name}은 이미 사용중인 부자재 분류 입니다.`,
      );
    }

    return input;
  }

  async upsert(createSubsidiaryCategory: CreateSubsidiaryCategoryInput) {
    return this.subsidiaryCategoryRepository.upsert(createSubsidiaryCategory);
  }
}
