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
          orderStatus: '출고완료',
          productCode: { $exists: true },
          mallId: { $exists: true, $nin: ['로켓그로스', '정글북'] },
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
                as: 'prevSales',
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
                prevAccDeliveryCost: '$prevSale.accDeliveryCost',
                prevAccTotalPayment: '$prevSale.accTotalPayment',
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
    return result?.[0];
  }
}
