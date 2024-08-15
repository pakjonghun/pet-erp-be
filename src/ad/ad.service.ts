import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAdInput } from './dto/create-ad.input';
import { UpdateAdInput } from './dto/update-ad.input';
import { AdRepository } from './ad.repository';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, FilterQuery, Model } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { AdsInput } from './dto/ads.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { Product } from 'src/product/entities/product.entity';
import { Ad, AdInterface } from './entities/ad.entity';
import { Client } from 'src/client/entities/client.entity';
import { ColumnOption } from 'src/client/types';
import * as ExcelJS from 'exceljs';
import * as dayjs from 'dayjs';
import { AdTypeToEng, AdTypeToHangle } from './constants';

@Injectable()
export class AdService {
  constructor(
    private readonly adRepository: AdRepository,
    private readonly utilService: UtilService,

    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,

    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(inputs: CreateAdInput) {
    const session = await this.connection.startSession();
    session.startTransaction();
    try {
      const docs = await this.adRepository.objectToDocuments(
        inputs.createAdsInput,
      );
      const result = await this.adRepository.bulkWrite(docs);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
  }

  async findMany({
    keyword,
    skip,
    limit,
    from,
    to,
    type,
    sort = 'updatedAt',
    order = -1,
  }: AdsInput) {
    const filterQuery: FilterQuery<Ad> = {
      type: {
        $regex: this.utilService.escapeRegex(type ?? ''),
        $options: 'i',
      },
    };

    if (keyword) {
      const productList = await this.productModel
        .find({
          $or: [
            {
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            },
            {
              code: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            },
          ],
        })
        .select(['code', '-_id'])
        .lean<{ code: string }[]>();

      const productCodeList = productList.map((product) => {
        return product.code;
      });

      const clientList = await this.clientModel
        .find({
          $or: [
            {
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            },
            {
              code: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            },
          ],
        })
        .select(['code', '-_id'])
        .lean<{ code: string }[]>();

      const clientCodeList = clientList.map((client) => {
        return client.code;
      });

      const or = [];

      if (productCodeList.length) {
        or.push({
          productCodeList: {
            // $exists: true,
            $elemMatch: {
              $in: productCodeList,
            },
          },
        });
      }

      if (clientCodeList.length) {
        or.push({
          clientCode: {
            // $exists: true,
            $in: clientCodeList,
          },
        });
      }

      if (or.length) {
        filterQuery['$or'] = or;
      }
    }

    if (from) {
      filterQuery.to = { $gte: from };
    }

    if (to) {
      filterQuery.from = { $lte: to };
    }

    const result = await this.adRepository.findMany({
      filterQuery,
      skip,
      limit,
      order: order == -1 ? OrderEnum.DESC : OrderEnum.ASC,
      sort,
    });

    return result;
  }

  async update({ _id, ...body }: UpdateAdInput) {
    return this.adRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const result = await this.adRepository.remove({ _id });
    return result;
  }

  async upload(worksheet: ExcelJS.Worksheet) {
    const colToField: Record<number, ColumnOption<AdInterface>> = {
      1: {
        fieldName: 'from',
        transform: (value: string) => {
          if (!value) {
            throw new BadRequestException(`시작날짜가 입력되지 않았습니다.`);
          }
          const isDate = dayjs(value, 'YYYY-MM-DD').isValid();
          if (!isDate) {
            throw new BadRequestException(
              `${value}는 올바른 시작날짜 형식이 아닙니다. 올바른 예)2024-10-10`,
            );
          }
          return dayjs(value).toDate();
        },
      },
      2: {
        fieldName: 'to',
        transform: (value: string) => {
          if (!value) {
            throw new BadRequestException(`종료날짜가 입력되지 않았습니다.`);
          }
          const isDate = dayjs(value, 'YYYY-MM-DD').isValid();
          if (!isDate) {
            throw new BadRequestException(
              `${value}는 올바른 종료날짜 형식이 아닙니다. 올바른 예)2024-10-10 `,
            );
          }
          return dayjs(value).toDate();
        },
      },
      3: { fieldName: 'price', transform: (value) => value || 0 },
      4: {
        fieldName: 'type',
        transform: (value: string) => {
          const rawText = value?.trim();
          if (!rawText) {
            throw new BadRequestException('광고 타입이 입력되지 않았습니다.');
          }

          const hasValue = AdTypeToEng[rawText];
          if (!hasValue) {
            throw new BadRequestException(
              `${rawText} 올바른 광고타입이 아닙니다.`,
            );
          }
          return AdTypeToEng[value] ?? '';
        },
      },
      5: {
        fieldName: 'clientCode',
        transform: (value: string) => {
          return value?.trim() ?? '';
        },
      },
      6: {
        fieldName: 'productCodeList',
        transform: (value: string) => {
          return value.split(',').map((item) => item.trim());
        },
      },
    };

    const allData = this.utilService.excelToObject(worksheet, colToField, 4);

    const clientNameList = allData
      .map((item) => item.clientCode?.trim())
      .filter((item) => !!item);
    const clientCodesSetted = Array.from(new Set(clientNameList));
    const clientList = await this.clientModel
      .find({ name: { $in: clientCodesSetted } })
      .lean<Client[]>();
    const clientByName = new Map<string, Client>(
      clientList.map((c) => [c.name, c]),
    );

    const productNameList = allData.flatMap((d) => d.productCodeList);
    const productNamesSetted = Array.from(new Set(productNameList));
    const productList = await this.productModel
      .find({
        name: { $in: productNamesSetted },
      })
      .lean<Product[]>();
    const productByName = new Map<string, Product>(
      productList.map((p) => [p.name, p]),
    );

    const noClientNames = [];
    const noProductNames = [];
    const parsedData = allData.map((a) => {
      const client = clientByName.get(a.clientCode);
      if (a.clientCode && !client) {
        noClientNames.push(a.clientCode);
      }
      return {
        ...a,
        clientCode: a.clientCode ? client?.code : '',
        productCodeList: a?.productCodeList
          ? a?.productCodeList
              .map((p) => {
                const product = productByName.get(p);
                if (!product && p) {
                  noProductNames.push(p);
                }
                return product?.code;
              })
              .filter((i) => !!i)
          : [],
      };
    });
    if (noClientNames.length) {
      const clientNameString = Array.from(new Set(noClientNames)).join(', ');
      throw new BadRequestException(
        `${clientNameString} 는 존재하지 않는 거래처 입니다.`,
      );
    }

    if (noProductNames.length) {
      const productNameString = Array.from(new Set(noProductNames)).join(', ');
      throw new BadRequestException(
        `${productNameString}는 존재하지 않는 제품입니다.`,
      );
    }

    const documents = await this.adRepository.objectToDocuments(parsedData);
    await this.adRepository.bulkWrite(documents);
  }

  async downloadExcel() {
    const allData = await this.adRepository.model
      .find()
      .select('-_id -createdAt -updatedAt')
      .lean<Ad[]>();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    worksheet.columns = [
      { header: '시작날짜', key: 'from', width: 40 },
      { header: '종료날짜', key: 'to', width: 40 },
      { header: '광고비용', key: 'price', width: 70 },
      { header: '광고타입', key: 'type', width: 50 },
      { header: '광고채널', key: 'clientCode', width: 40 },
      {
        header: '광고제품 리스트',
        key: 'productCodeList',
        width: 70,
      },
    ];

    const clientCodeList = allData
      .map((item) => item.clientCode)
      .filter((item) => !!item);
    const clientCodesSetted = Array.from(new Set(clientCodeList));
    const clientList = await this.clientModel
      .find({ code: { $in: clientCodesSetted } })
      .lean<Client[]>();
    const clientByCode = new Map<string, Client>(
      clientList.map((c) => [c.code, c]),
    );

    const productCodeList = allData.flatMap((d) => d.productCodeList);
    const productCodesSetted = Array.from(new Set(productCodeList));
    const productList = await this.productModel
      .find({
        code: { $in: productCodesSetted },
      })
      .lean<Product[]>();
    const productByCode = new Map<string, Product>(
      productList.map((p) => [p.code, p]),
    );

    allData.forEach((a) => {
      const newObject = {
        type: AdTypeToHangle[a.type],
        from: dayjs(a.from).format('YYYY-MM-DD'),
        to: dayjs(a.to).format('YYYY-MM-DD'),
        price: a.price,
        clientCode: a.clientCode
          ? clientByCode.get(a.clientCode).name ?? ''
          : '',
        productCodeList: a.productCodeList
          ? a.productCodeList
              .map((p) => {
                const t = productByCode.get(p);
                return t?.name ?? '';
              })
              .join(', ')
          : '',
      };
      worksheet.addRow(newObject);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
