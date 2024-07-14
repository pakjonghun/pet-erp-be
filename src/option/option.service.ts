import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateOptionInput } from './dto/create-option.input';
import { UpdateOptionInput } from './dto/update-option.input';
import { OptionRepository } from './option.repository';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { ColumnOption } from 'src/client/types';
import { Option, OptionInterface } from './entities/option.entity';
import { OptionsInput } from './dto/options.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { Product } from 'src/product/entities/product.entity';
import { OutProduct } from './dto/options.output';
import * as ExcelJS from 'exceljs';

@Injectable()
export class OptionService {
  constructor(
    private readonly optionRepository: OptionRepository,
    private readonly utilService: UtilService,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(createOptionInput: CreateOptionInput) {
    await this.idDuplicateCheck(createOptionInput.id);
    await this.productCodeExistCheck(createOptionInput.productCodeList);
    return this.optionRepository.create(createOptionInput);
  }

  async update({ id, ...body }: UpdateOptionInput) {
    if (body.productCodeList.length > 0) {
      await this.productCodeExistCheck(body.productCodeList);
    }

    return this.optionRepository.update({ id }, body);
  }

  async findMany({ keyword, skip, limit }: OptionsInput) {
    const filterQuery: FilterQuery<Option> = {
      $or: [
        {
          name: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          id: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
      ],
    };

    return this.optionRepository.findMany({
      filterQuery,
      skip,
      limit,
      order: OrderEnum.DESC,
      sort: 'updatedAt',
    });
  }

  async remove(id: string) {
    const isExist = await this.optionRepository.exists({ id });
    if (!isExist) {
      throw new ConflictException('해당 옵션을 찾을 수 없습니다.');
    }

    const result = await this.optionRepository.remove({ id });
    return result;
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<OptionInterface>> = {
      1: {
        fieldName: 'id',
      },
      2: {
        fieldName: 'name',
      },
      3: {
        fieldName: 'count',
      },
      4: {
        fieldName: 'productCodeList',
      },
    };

    const objectList = this.utilService.excelToObject(
      worksheet,
      colToField,
      1,
    ) as Option[];
    const optionIdList = objectList.map((obj) => obj.id);
    const optionList = await this.optionRepository.model.find({
      id: { $in: optionIdList },
    });
    const optionById = new Map<string, Option>(
      optionList.map((o) => [o.id, o]),
    );

    for (const object of objectList) {
      const isExistOption = optionById.has(object.id);
      if (isExistOption) {
        throw new BadRequestException(
          `${object.id}는 이미 사용중인 옵션 아이디 입니다.`,
        );
      }
    }
    const productNameList = objectList.flatMap((obj) => {
      return (obj.productCodeList as unknown as string)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => !!item);
    });
    const filteredProductNameList = Array.from(new Set(productNameList));
    const productList = await this.productModel
      .find({ name: { $in: filteredProductNameList } })
      .select(['-_id', 'code', 'name'])
      .lean<OutProduct[]>();
    const productByName = new Map<string, OutProduct>(
      productList.map((p) => [p.name, p]),
    );

    for (const obj of objectList) {
      const productCodeList: string[] = [];

      for (const name of (obj.productCodeList as unknown as string)
        .split(',')
        .map((item) => item.trim())
        .filter((item) => !!item)) {
        const product = productByName.get(name);
        if (!product) {
          throw new BadRequestException(
            `${obj.name} 옵션에 입력되 있는 ${name} 제품은 존재하지 않는 제품입니다.`,
          );
        }
        productCodeList.push(product.code);
      }
      obj.productCodeList = productCodeList;
    }

    const documents = await this.optionRepository.objectToDocuments(objectList);
    this.utilService.checkDuplicatedField(documents, 'id');
    await this.optionRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = await this.optionRepository.model
      .find()
      .select('-_id -createdAt')
      .lean<Option[]>();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: '아이디', key: 'id', width: 70 },
      { header: '이름', key: 'name', width: 40 },
      { header: '제품숫자', key: 'count', width: 40 },
      { header: '적용할수있는 제품목록', key: 'productNameList', width: 300 },
    ];

    const productCodeList = allData.flatMap((item) => item.productCodeList);

    const productList = await this.productModel
      .find({
        code: { $in: productCodeList },
      })
      .select(['-_id', 'name', 'code'])
      .lean<OutProduct[]>();
    const productByCode = new Map<string, OutProduct>(
      productList.map((p) => [p.code, p]),
    );

    for (const doc of allData) {
      const newData = {
        ...doc,
        productNameList: '',
      };
      const productNameList: string[] = [];
      for (const code of doc.productCodeList) {
        const product = productByCode.get(code);
        if (!product) {
          throw new BadRequestException(
            `${doc.name} 옵션에 입력된 ${code} 제품코드는 존재하지 않는 제품코드 입니다.`,
          );
        }
        productNameList.push(product.name.trim());
      }
      newData.productNameList = productNameList.join(',');
      worksheet.addRow(newData);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  private async idDuplicateCheck(optionId: string) {
    const isExist = await this.optionRepository.exists({ id: optionId });
    if (isExist) {
      throw new BadRequestException(
        `${optionId}는 이미 사용중인 옵션 아이디 입니다.`,
      );
    }
  }

  private async productCodeExistCheck(productCodeList: string[]) {
    const productList = await this.productModel
      .find({ code: { $in: productCodeList } })
      .select(['-_id', 'code', 'name'])
      .lean<OutProduct[]>();

    const productByCode = new Map<string, OutProduct>(
      productList.map((p) => [p.code, p]),
    );

    for (const p of productCodeList) {
      if (!productByCode.has(p)) {
        throw new BadRequestException(`${p}코드의 제품을 찾을 수 없습니다.`);
      }
    }
  }
}
