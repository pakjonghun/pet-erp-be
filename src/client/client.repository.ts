import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Client } from './entities/client.entity';
import { Model, PipelineStage } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { Sale } from 'src/sale/entities/sale.entity';
import { FindDateScrollInput } from 'src/common/dtos/find-date-scroll.input';
import { ClientSaleMenu } from './dtos/client-sale-menu.output';

@Injectable()
export class ClientRepository extends AbstractRepository<Client> {
  logger = new Logger(ClientRepository.name);

  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Client.name) clientModel: Model<Client>,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
  ) {
    super(clientModel);
  }

  async clientSaleMenu({ from, to, skip, limit }: FindDateScrollInput) {
    const prevRange = this.utilService.getBeforeDate({ from, to });

    const pipeline: PipelineStage[] = [
      {
        $match: {
          mallId: {
            $ne: '로켓그로스',
          },
          orderStatus: '출고완료',
          saleAt: {
            $gte: from,
            $lt: to,
          },
          wonCost: {
            $exists: true,
            $gte: 0,
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
        },
      },
      {
        $addFields: {
          accProfit: {
            $subtract: ['$accPayCost', '$accWonCost'],
          },
        },
      },
      {
        $addFields: {
          profitRate: {
            $round: [
              {
                $multiply: [
                  {
                    $cond: {
                      if: {
                        $or: [
                          {
                            $eq: ['$accWonCost', 0],
                          },
                          {
                            $eq: ['$accWonCost', null],
                          },
                        ],
                      },
                      then: 0,
                      else: {
                        $divide: ['$accProfit', '$accWonCost'],
                      },
                    },
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
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
                      mallId: {
                        $ne: '로켓그로스',
                      },
                      orderStatus: '출고완료',
                      saleAt: {
                        $gte: from,
                        $lt: to,
                      },
                      wonCost: {
                        $exists: true,
                        $gte: 0,
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$productCode',
                      accCount: {
                        $sum: '$count',
                      },
                    },
                  },
                  {
                    $sort: {
                      accCount: -1,
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
                as: 'prevSales',
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: ['$mallId', '$$mallId'],
                      },
                      mallId: {
                        $ne: '로켓그로스',
                      },
                      orderStatus: '출고완료',
                      saleAt: {
                        $gte: prevRange.from,
                        $lt: prevRange.to,
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
                    },
                  },
                  {
                    $addFields: {
                      accProfit: {
                        $subtract: ['$accPayCost', '$accWonCost'],
                      },
                    },
                  },
                  {
                    $addFields: {
                      profitRate: {
                        $round: [
                          {
                            $multiply: [
                              {
                                $cond: {
                                  if: {
                                    $or: [
                                      {
                                        $eq: ['$accWonCost', 0],
                                      },
                                      {
                                        $eq: ['$accWonCost', null],
                                      },
                                    ],
                                  },
                                  then: 0,
                                  else: {
                                    $divide: ['$accProfit', '$accWonCost'],
                                  },
                                },
                              },
                              100,
                            ],
                          },
                          2,
                        ],
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
                prevSale: {
                  $arrayElemAt: ['$prevSales', 0],
                },
              },
            },
            {
              $addFields: {
                prevAccCount: '$prevSale.accCount',
                prevAccPayCost: '$prevSale.accPayCost',
                prevAccWonCost: '$prevSale.accWonCost',
                prevAccProfit: '$prevSale.accProfit',
                prevProfitRate: '$prevSale.profitRate',
              },
            },
            {
              $project: {
                prevSales: 0,
                prevSale: 0,
              },
            },
            {
              $sort: {
                accCount: -1,
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
    return result?.[0];
  }
}
