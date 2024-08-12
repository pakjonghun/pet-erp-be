import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

  // async upload(worksheet: ExcelJS.Worksheet) {
  //   const colToField: Record<number, ColumnOption<AdInterface>> = {
  //     1: { fieldName: 'from' },
  //     2: { fieldName: 'to' },
  //     3: { fieldName: 'price' },
  //     4: { fieldName: 'type' },
  //     5: { fieldName: 'clientCode' },
  //     6: {
  //       fieldName: 'productCodeList',
  //       transform: (value) => {
  //         if (typeof value === 'string') {
  //           const lowerKey =
  //             value.toLowerCase() as keyof typeof HangleToClientType;
  //           const clientType = HangleToClientType[lowerKey];
  //           if (!clientType) {
  //             throw new BadRequestException(
  //               `${value}는 올바른 거래처 타입이 아닙니다.`,
  //             );
  //           }

  //           return clientType;
  //         }
  //       },
  //     },
  //     7: { fieldName: 'payDate' },
  //     8: { fieldName: 'manager' },
  //     9: { fieldName: 'managerTel' },
  //     10: {
  //       fieldName: 'inActive',
  //       transform: (value) => {
  //         const valueType = typeof value;
  //         if (typeof value == 'string') {
  //           if (value.trim() === '거래중') return true;
  //           if (value.trim() === '거래종료') return false;

  //           throw new BadRequestException(
  //             `${value} 는 올바른 거래여부가 아닙니다.`,
  //           );
  //         }

  //         if (valueType == 'boolean') {
  //           return value;
  //         }
  //         return true;
  //       },
  //     },
  //     11: {
  //       fieldName: 'storageId',
  //       transform: (v) => (v == null ? null : v),
  //     },
  //     12: {
  //       fieldName: 'deliveryFreeProductCodeList',
  //     },
  //     13: {
  //       fieldName: 'deliveryNotFreeProductCodeList',
  //     },
  //     14: {
  //       fieldName: 'isSabangService',
  //     },
  //   };

  //   const objectList = this.utilService.excelToObject(worksheet, colToField, 3);
  //   const freeDeliveryProductNameList = objectList.flatMap((item) =>
  //     item.deliveryFreeProductCodeList
  //       ? item.deliveryFreeProductCodeList
  //           .split(',')
  //           .filter((item) => !!item)
  //           .map((item) => item.trim())
  //       : [],
  //   );
  //   const notFreeDeliveryProductNameList = objectList.flatMap((item) =>
  //     item.notFreeDeliveryProductNameList
  //       ? item.notFreeDeliveryProductNameList
  //           .split(',')
  //           .filter((item) => !!item)
  //           .map((item) => item.trim())
  //       : [],
  //   );

  //   const concatNameList = freeDeliveryProductNameList.concat(
  //     notFreeDeliveryProductNameList,
  //   );

  //   const productByName = new Map<string, Product>();

  //   if (concatNameList.length) {
  //     const productList = await this.productModel
  //       .find({
  //         name: { $in: concatNameList },
  //       })
  //       .lean<Product[]>();

  //     productList.forEach((doc) => {
  //       productByName.set(doc.name, doc);
  //     });
  //   }

  //   const storageNameList = objectList.map((item) => item.storageId);
  //   const storageList = await this.storageModel.find({
  //     name: { $in: storageNameList },
  //   });
  //   const storageByName = new Map<string, Storage>(
  //     storageList.map((item) => [item.name, item]),
  //   );

  //   objectList.forEach((object) => {
  //     if (typeof object.isSabangService == 'string') {
  //       const isSabangService =
  //         (object.isSabangService as string)?.trim() === '지원';
  //       object.isSabangService = isSabangService;
  //     }

  //     if (object.storageId) {
  //       object.storageId =
  //         storageByName.get(object.storageId)?._id.toHexString() ?? '';
  //     }

  //     if (object.deliveryFreeProductCodeList) {
  //       const productNameList = object.deliveryFreeProductCodeList
  //         ? (object.deliveryFreeProductCodeList as unknown as string)
  //             .split(',')
  //             .filter((item) => item)
  //             .map((item) => item.trim())
  //         : [];

  //       object.deliveryFreeProductCodeList = productNameList
  //         .map((item) => {
  //           const product = productByName.get(item);
  //           return product?.code ?? '';
  //         })
  //         .filter((item) => !!item);
  //     } else {
  //       object.deliveryFreeProductCodeList = undefined;
  //     }

  //     if (object.deliveryNotFreeProductCodeList) {
  //       const productNameList = object.deliveryNotFreeProductCodeList
  //         ? (object.deliveryNotFreeProductCodeList as unknown as string)
  //             .split(',')
  //             .filter((item) => item)
  //             .map((item) => item.trim())
  //         : [];

  //       object.deliveryNotFreeProductCodeList = productNameList
  //         .map((item) => {
  //           const product = productByName.get(item);
  //           return product?.code ?? '';
  //         })
  //         .filter((item) => !!item);
  //     } else {
  //       object.deliveryNotFreeProductCodeList = undefined;
  //     }
  //   });

  //   const documents = await this.clientRepository.objectToDocuments(objectList);
  //   this.utilService.checkDuplicatedField(documents, 'code');
  //   // await this.clientRepository.docUniqueCheck(documents, 'code');
  //   this.utilService.checkDuplicatedField(documents, 'name');
  //   // await this.clientRepository.docUniqueCheck(documents, 'name');
  //   await this.clientRepository.bulkUpsert(documents);
  // }

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
