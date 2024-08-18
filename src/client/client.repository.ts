import { ClientDashboardView } from './../common/virtualView/ClientDashboardView/ClientDashboardView';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Client, HangleToClientType } from './entities/client.entity';
import { Model, PipelineStage, Types } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { Sale } from 'src/sale/entities/sale.entity';
import { FindDateScrollInput } from 'src/common/dtos/find-date-scroll.input';
import { ClientSaleMenu } from './dtos/client-sale-menu.output';
import { profit, profitRate } from 'src/common/query/sale';
import { OutClient } from './dtos/clients.output';
import { ClientsInput } from './dtos/clients.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { Product } from 'src/product/entities/product.entity';
import { Storage } from 'src/storage/entities/storage.entity';

@Injectable()
export class ClientRepository extends AbstractRepository<Client> {
  logger = new Logger(ClientRepository.name);

  constructor(
    private readonly adService: AdService,
    private readonly utilService: UtilService,
    private readonly saleService: SaleService,
    @InjectModel(Client.name) clientModel: Model<Client>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Ad.name) private readonly adModel: Model<Ad>,
    @InjectModel(ClientDashboardView.name)
    private readonly clientDashboardView: Model<ClientDashboardView>,
  ) {
    super(clientModel);
  }

  async clientSaleMenu({
    from,
    to,
    skip,
    limit,
    clientCodeAndNameList,
    sort = 'accCount',
    order = -1,
  }: FindDateScrollInput & {
    clientCodeAndNameList: { code: string; name: string }[];
  }) {
    const clientNameList = clientCodeAndNameList.map((c) => c.name);
    const [monthFrom, monthTo] = this.utilService.recentDayjsMonthRange();

    const adPrices = await this.adService.getAdTotal({ from, to });
    const typePrice = adPrices.typePrice;
    const adPriceByType = new Map<AdType, number>();
    typePrice.forEach((t) => {
      adPriceByType.set(t._id, t.typePrice);
    });
    const channelProductPrice =
      adPriceByType.get(AdType.CHANNEL_APP_PRODUCT) ?? 0;
    const channelPrice = adPriceByType.get(AdType.CHANNEL_PRODUCT_RATE) ?? 0;
    const channelSpecialPrice =
      adPriceByType.get(AdType.CHANNEL_SPECIAL_PRODUCT) ?? 0;
    const companyPrice = adPriceByType.get(AdType.COMPANY_RATE) ?? 0;

    await this.clientDashboardView.aggregate([
      {
        $match: {
          saleAt: {
            $gte: from,
            $lt: to,
          },
        },
      },

      {
        $limit: 1,
      },
    ]);

    const pipeline: PipelineStage[] = [
      {
        $match: {
          orderStatus: '출고완료',
          productCode: { $exists: true },
          mallId: {
            $exists: true,
            $nin: ['로켓그로스', '정글북'],
            $in: clientNameList,
          },
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
          totalPayment: { $exists: true },
          saleAt: {
            $gte: from,
            $lt: to,
          },
        },
      },
      {
        $project: {
          count: 1,
          mallId: 1,
          payCost: 1,
          wonCost: 1,
          productCode: 1,
          deliveryCost: 1,
          totalPayment: 1,
          deliveryBoxCount: 1,
        },
      },
      {
        $group: {
          _id: '$mallId',
          accPayCost: {
            $sum: '$payCost',
          },
          accWonCost: {
            $sum: '$wonCost',
          },
          accCount: {
            $sum: '$count',
          },
          accDeliveryCost: {
            $sum: {
              $multiply: ['$deliveryCost', '$deliveryBoxCount'],
            },
          },
          accTotalPayment: {
            $sum: '$totalPayment',
          },
        },
      },
      profit,
      profitRate,
      {
        $lookup: {
          from: 'clients',
          as: 'client_info',
          foreignField: 'name',
          localField: '_id',
        },
      },
      {
        $unwind: {
          path: '$client_info',
        },
      },
      {
        $addFields: {
          _id: '$client_info._id',
          code: '$client_info.code',
          feeRate: '$client_info.feeRate',
          name: '$client_info.name',
          clientType: '$client_info.clientType',
          businessName: '$client_info.businessName',
          businessNumber: '$client_info.businessNumber',
          inActive: '$client_info.inActive',
          payDate: '$client_info.payDate',
          isSabangService: '$client_info.isSabangService',
        },
      },
      {
        $project: {
          client_info: 0,
        },
      },
      {
        $facet: {
          data: [
            {
              $lookup: {
                let: {
                  mallId: '$name',
                },
                from: 'sales',
                as: 'products',
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$mallId', '$$mallId'],
                      },
                      orderStatus: '출고완료',
                      productCode: { $exists: true },
                      count: { $exists: true },
                      payCost: { $exists: true },
                      wonCost: { $exists: true },
                      saleAt: {
                        $gte: from,
                        $lt: to,
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$productCode',
                      accCount: {
                        $sum: '$count',
                      },
                      accPayCost: {
                        $sum: '$payCost',
                      },
                      accWonCost: {
                        $sum: '$wonCost',
                      },
                      accDeliveryCost: {
                        $sum: {
                          $multiply: ['$deliveryCost', '$deliveryBoxCount'],
                        },
                      },
                      accTotalPayment: {
                        $sum: '$totalPayment',
                      },
                    },
                  },
                  {
                    $sort: {
                      accCount: -1,
                      _id: 1,
                    },
                  },
                  {
                    $lookup: {
                      from: 'products',
                      as: 'product_info',
                      foreignField: 'code',
                      localField: '_id',
                      pipeline: [
                        {
                          $project: {
                            name: 1,
                            _id: 0,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $unwind: '$product_info',
                  },
                  {
                    $addFields: {
                      name: '$product_info.name',
                    },
                  },
                  {
                    $project: {
                      product_info: 0,
                      _id: 0,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                let: {
                  mallId: '$name',
                },
                from: 'sales',
                as: 'monthSales',
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$mallId', '$$mallId'],
                      },
                      orderStatus: '출고완료',
                      productCode: { $exists: true },
                      count: { $exists: true },
                      payCost: { $exists: true },
                      wonCost: { $exists: true },
                      saleAt: {
                        $gte: monthFrom.toDate(),
                        $lt: monthTo.toDate(),
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      accCount: {
                        $sum: '$count',
                      },
                      accPayCost: {
                        $sum: '$payCost',
                      },
                      accWonCost: {
                        $sum: '$wonCost',
                      },
                      accDeliveryCost: {
                        $sum: {
                          $multiply: ['$deliveryCost', '$deliveryBoxCount'],
                        },
                      },
                      accTotalPayment: {
                        $sum: '$totalPayment',
                      },
                      name: {
                        $first: '$mallId',
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                monthSales: {
                  $arrayElemAt: ['$monthSales', 0],
                },
              },
            },
            {
              $sort: {
                [sort]: order,
                _id: 1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $addFields: {
          totalCount: {
            $ifNull: [
              {
                $arrayElemAt: ['$totalCount.count', 0],
              },
              0,
            ],
          },
        },
      },
    ];

    const result = await this.saleModel.aggregate<ClientSaleMenu>(pipeline);
    const initResult = result[0];

    // return appendAd;
    return initResult;
  }

  async findFullSortClient({
    sort = 'createdAt',
    order = OrderEnum.DESC,
    skip,
    limit,
    keyword,
    keywordTarget,
  }: ClientsInput) {
    const newSort = sort == 'storage' ? `${sort}.name` : sort;

    const pipelineStage: PipelineStage[] = [
      {
        $facet: {
          data: [
            {
              $addFields: {
                storageObjectId: {
                  $toObjectId: '$storageId',
                },
              },
            },
            {
              $lookup: {
                as: 'storageInfo',
                foreignField: '_id',
                localField: 'storageObjectId',
                from: 'storages',
              },
            },
            {
              $addFields: {
                storage: {
                  $arrayElemAt: ['$storageInfo', 0],
                },
              },
            },
            {
              $project: {
                storageObjectId: 0,
                storageInfo: 0,
              },
            },
            {
              $sort: {
                [newSort]: order == OrderEnum.DESC ? -1 : 1,
                _id: 1,
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
          ],
          totalCount: [
            {
              $count: 'count',
            },
          ],
        },
      },
      {
        $addFields: {
          totalCount: {
            $ifNull: [
              {
                $arrayElemAt: ['$totalCount.count', 0],
              },
              0,
            ],
          },
        },
      },
    ];

    if (keyword) {
      const refTargetKeyword = [
        'storage',
        'storageId',
        'freeDelivery',
        'notFreeDelivery',
      ];
      if (refTargetKeyword.includes(keywordTarget)) {
        if (keywordTarget == 'storage' || keywordTarget == 'storageId') {
          const storageList = await this.storageModel
            .find({
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>();

          const storageIdList = storageList.map((s) => s._id.toHexString());

          const matchStage = {
            $match: {
              storageId: {
                $in: storageIdList,
              },
            },
          };
          pipelineStage.unshift(matchStage);
        }

        if (
          keywordTarget == 'freeDelivery' ||
          keywordTarget == 'notFreeDelivery'
        ) {
          const productList = await this.productModel
            .find({
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            })
            .select(['-_id', 'code'])
            .lean<{ code: string }[]>();

          const productCodeList = productList.map((p) => p.code);

          const fieldName =
            keywordTarget == 'freeDelivery'
              ? 'deliveryFreeProductCodeList'
              : 'deliveryNotFreeProductCodeList';
          const matchStage = {
            $match: {
              [fieldName]: {
                $in: productCodeList,
              },
            },
          };

          pipelineStage.unshift(matchStage);
        }
      } else {
        if (keywordTarget == 'feeRate') {
          const matchStage = {
            $match: {
              feeRate: (keyword as unknown as number) / 100,
            },
          };
          pipelineStage.unshift(matchStage);
        } else {
          let newKeyword = keyword;
          if (keywordTarget == 'clientType') {
            newKeyword = HangleToClientType[keyword] ?? '';
          }

          const matchStage = {
            $match: {
              $expr: {
                $regexMatch: {
                  input: { $toString: `$${keywordTarget}` },
                  regex: this.utilService.escapeRegex(newKeyword),
                  options: 'i',
                },
              },
            },
          };
          pipelineStage.unshift(matchStage);
        }
      }
    }
    const result = await this.model.aggregate<{
      totalCount: number;
      data: OutClient[];
    }>(pipelineStage);

    return result[0];
  }
}
