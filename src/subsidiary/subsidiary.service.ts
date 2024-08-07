import { Stock } from './../stock/entities/stock.entity';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateSubsidiaryInput } from './dto/create-subsidiary.input';
import { UpdateSubsidiaryInput } from './dto/update-subsidiary.input';
import { SubsidiaryRepository } from './subsidiary.repository';
import { ProductService } from 'src/product/product.service';
import { ColumnOption } from 'src/client/types';
import { Subsidiary, SubsidiaryInterface } from './entities/subsidiary.entity';
import { UtilService } from 'src/util/util.service';
import { SubsidiariesInput } from './dto/subsidiaries.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { SubsidiaryCategoryService } from 'src/subsidiary-category/subsidiary-category.service';
import { FilterQuery, Model } from 'mongoose';
import * as ExcelJS from 'exceljs';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SubsidiaryService {
  constructor(
    @InjectModel(Stock.name) private readonly stockModel: Model<Stock>,
    private readonly productService: ProductService,
    private readonly utilService: UtilService,
    private readonly subsidiaryCategoryService: SubsidiaryCategoryService,
    private readonly subsidiaryRepository: SubsidiaryRepository,
  ) {}

  async create(createSubsidiaryInput: CreateSubsidiaryInput) {
    const createBody = await this.beforeCreateOrUpdate(createSubsidiaryInput);
    if (!this.isCreateInput(createBody)) {
      throw new InternalServerErrorException(
        '부자재 생성시 타입가드에 문제가 있습니다. 개발자에게 문의하세요.',
      );
    }
    const createResult = await this.subsidiaryRepository.create(createBody);
    const result = await this.subsidiaryRepository.findFullSubsidiary({
      _id: createResult._id,
    });
    return result;
  }

  async findMany({ keyword, ...query }: SubsidiariesInput) {
    const result = await this.subsidiaryRepository.findFullManySubsidiary({
      ...query,
      order: OrderEnum.DESC,
      sort: 'createdAt',
      filterQuery: {
        name: { $regex: this.utilService.escapeRegex(keyword), $options: 'i' },
      },
    });

    const newData = result.data.map((item) => {
      if (!item.productList || item.productList?.length === 0) {
        item.productList = [];
      }
      return item;
    });

    return {
      totalCount: result.totalCount,
      data: newData,
    };
  }

  async update(updateSubsidiaryInput: UpdateSubsidiaryInput) {
    const updateBody = await this.beforeCreateOrUpdate(updateSubsidiaryInput);
    if (!this.isUpdateInput(updateBody)) {
      throw new InternalServerErrorException(
        '부자재 생성시 타입가드에 문제가 있습니다. 개발자에게 문의하세요.',
      );
    }
    const { _id, ...body } = updateBody;
    await this.subsidiaryRepository.update({ _id }, body);
    const result = await this.subsidiaryRepository.findFullSubsidiary({ _id });
    return result;
  }

  async remove(_id: string) {
    const isStockExist = await this.stockModel.exists({
      isSubsidiary: true,
      product: _id,
    });
    if (isStockExist) {
      throw new BadRequestException(
        '해당 부자재는 재고 입출고 기록이 있습니다. 부자재를 삭제할 수 없습니다.',
      );
    }
    return this.subsidiaryRepository.remove({ _id });
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
      const createBody = await this.beforeUpload(object);
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
          ? object.productList.map((product) => product.name).join(', ')
          : '',
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
    const categoryName = input.category;
    const name = input.name;
    const productNameList = input.productList;
    let category = null;
    let productList = null;

    if (code) {
      await this.subsidiaryRepository.uniqueCheck({ code });
    }

    if (categoryName) {
      category = await this.subsidiaryCategoryService.upsert({
        name: categoryName,
      });
    }

    if (name) {
      if (this.isUpdateInput(input)) {
        await this.subsidiaryRepository.uniqueCheck({
          name,
          _id: { $ne: input._id },
        });
      } else {
        await this.subsidiaryRepository.uniqueCheck({ name });
      }
    }

    if (productNameList && productNameList.length) {
      productList = await this.productService.findAll({
        name: { $in: productNameList },
      });

      if (productNameList.length !== productList.length) {
        const notExistProductList = productNameList.filter(
          (item) => !productList.find((product) => product.name !== item),
        );
        const notExistProductNameString = notExistProductList.join(',  ');

        throw new BadRequestException(
          `선택한 제품 중 존재하지 않는 제품이 ${notExistProductList.length}개 있습니다. 존재하지 않는 제품의 이름은 : (${notExistProductNameString}) 입니다.`,
        );
      }
    }
    return {
      ...input,
      category,
      productList,
    };
  }

  private async beforeUpload(
    input: Omit<Subsidiary, 'category' | 'productList'> & {
      category: string;
      productList: string;
    },
  ) {
    const code = input.code;
    const name = input.name;
    const categoryName = input.category;

    if (typeof input.productList !== 'string') {
      input.productList = '';
    }

    const productNameList = input.productList
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item);

    const hasCommaName = productNameList.some((item) => item.includes(','));
    if (hasCommaName) {
      throw new BadRequestException("',' 는 부자재 이름에 포함될 수 없습니다.");
    }

    let category;
    let productList = [];

    await this.subsidiaryRepository.uniqueCheck({ code });
    await this.subsidiaryRepository.uniqueCheck({ name });

    if (categoryName) {
      category = await this.subsidiaryCategoryService.upsert({
        name: categoryName,
      });
    }

    if (productNameList.length) {
      productList = await this.productService.findAll({
        name: { $in: productNameList },
      });

      if (productNameList.length !== productList.length) {
        const notExistProductList = productNameList.filter(
          (item) => !productList.find((product) => product.name !== item),
        );
        const notExistProductNameString = notExistProductList.join(',  ');

        throw new BadRequestException(
          `선택한 제품 중 존재하지 않는 제품이 ${notExistProductList.length}개 있습니다. 존재하지 않는 제품은 : (${notExistProductNameString}) 입니다.`,
        );
      }
    }
    return {
      ...input,
      category,
      productList,
    };
  }

  exists(filterQuery: FilterQuery<Subsidiary>) {
    return this.subsidiaryRepository.exists(filterQuery);
  }
}
