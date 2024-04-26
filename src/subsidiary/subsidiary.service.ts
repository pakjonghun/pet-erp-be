import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { ObjectId } from 'mongodb';
import { SubsidiaryRepository } from './subsidiary.repository';
import { SubsidiaryCategoryRepository } from './subsidiary-category.repository';
import { ProductService } from 'src/product/product.service';
import { ColumnOption } from 'src/client/types';
import { SubsidiaryInterface } from './entities/subsidiary.entity';
import { UtilService } from 'src/common/services/util.service';
import { SubsidiariesInput } from './dto/subsidiaries.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import * as ExcelJS from 'exceljs';

@Injectable()
export class SubsidiaryService {
  constructor(
    private readonly utilService: UtilService,
    private readonly productService: ProductService,
    private readonly subsidiaryRepository: SubsidiaryRepository,
    private readonly subsidiaryCategoryRepository: SubsidiaryCategoryRepository,
  ) {}

  async create(createSubsidiaryInput: CreateSubsidiaryInput) {
    const createBody = await this.beforeCreateOrUpdate(createSubsidiaryInput);
    if (!this.isCreateInput(createBody)) return;
    return this.subsidiaryRepository.create(createBody);
  }

  findMany({ keyword, ...query }: SubsidiariesInput) {
    return this.subsidiaryRepository.findMany({
      ...query,
      order: OrderEnum.DESC,
      sort: 'createdAt',
      filterQuery: {
        name: { $regex: keyword, $options: 'i' },
      },
    });
  }

  async update(id: ObjectId, updateSubsidiaryInput: UpdateSubsidiaryInput) {
    const updateBody = await this.beforeCreateOrUpdate(updateSubsidiaryInput);
    if (this.isUpdateInput(updateBody)) {
      const { _id, ...body } = updateBody;
      return this.subsidiaryRepository.update({ _id }, body);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} subsidiary`;
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<SubsidiaryInterface>> = {
      1: {
        fieldName: 'code',
      },
      2: {
        fieldName: 'category',
      },
      3: {
        fieldName: 'name',
      },
      4: {
        fieldName: 'productList',
      },
      5: {
        fieldName: 'wonPrice',
      },
      6: {
        fieldName: 'leadTime',
      },
    };

    const objectList = this.utilService.excelToObject(worksheet, colToField, 2);
    const newObjectList = [];

    for await (const object of objectList) {
      const createBody = await this.beforeCreateOrUpdate(object);
      newObjectList.push(createBody);
    }

    const documents =
      await this.subsidiaryRepository.objectToDocuments(newObjectList);
    this.utilService.checkDuplicatedField(documents, 'code');
    await this.subsidiaryRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = this.subsidiaryRepository.model
      .find()
      .populate({
        path: 'category',
        select: ['name'],
      })
      .populate({
        path: 'productList',
        select: ['name'],
      })
      .select('-_id -createdAt -updatedAt')
      .cursor();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = [
      { header: '코드', key: 'code', width: 50 },
      { header: '분류', key: 'category', width: 50 },
      { header: '이름', key: 'name', width: 50 },
      { header: '상품 리스트', key: 'productList', width: 100 },
      { header: '원가', key: 'wonPrice', width: 50 },
      { header: '리드타임', key: 'leadTime', width: 50 },
    ];

    for await (const doc of allData) {
      const object = doc.toObject();
      const newObject = {
        ...object,
        category: object?.category?.name ?? '',
        productList: object.productList
          .map((product) => product.name)
          .join(', '),
      };

      worksheet.addRow(newObject);
    }

    await allData.close();

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private isUpdateInput(
    updateInput: any,
  ): updateInput is UpdateSubsidiaryInput {
    return '_id' in updateInput;
  }

  private isCreateInput(
    createInput: any,
  ): createInput is CreateSubsidiaryInput {
    return !('_id' in createInput);
  }

  private async beforeCreateOrUpdate(
    input: CreateSubsidiaryInput | UpdateSubsidiaryInput,
  ) {
    const code = input.code;
    const categoryId = input.category;
    const productIdList = input.productList;
    let category;
    let productList = [];

    const isCodeExist = await this.subsidiaryRepository.exists({ code });
    if (isCodeExist) {
      throw new BadRequestException(`${code}는 이미 사용중인 코드 입니다.`);
    }

    if (categoryId) {
      category = await this.subsidiaryCategoryRepository.findOne({
        _id: categoryId,
      });

      if (!category) {
        throw new BadRequestException(
          '선택한 부자재 분류는 존재하지 않는 분류 입니다.',
        );
      }
    }

    if (productIdList.length) {
      productList = await this.productService.findAll({
        _id: { $in: productIdList },
      });

      if (productIdList.length !== productList.length) {
        const notExistProductList = productIdList.filter(
          (item) => !productList.find((product) => product._id !== item),
        );
        const notExistProductNameString = notExistProductList.join(',  ');

        throw new BadRequestException(
          `선택한 제품 중 존재하지 않는 제품이 ${notExistProductList.length}개 있습니다. 존재하지 않는 제품의 아이디는 : (${notExistProductNameString}) 입니다.`,
        );
      }
    }

    return {
      ...input,
      category,
      productList,
    };
  }
}
