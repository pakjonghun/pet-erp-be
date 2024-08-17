import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AdType } from 'src/ad/entities/ad.entity';

@Injectable()
export class ClientDashboardView implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    await this.createClientDashboardView();
  }

  async createClientDashboardView() {
    const db = this.connection.db;
    const viewName = 'clientDashboardView';
    console.log(`${viewName}을 생성합니다.`);
    await db.collection(viewName).drop();

    await db.createCollection(viewName, {
      viewOn: 'sales',
      pipeline: [
        {
          $match: {
            orderStatus: '출고완료',
            productCode: { $exists: true },
            mallId: {
              $exists: true,
              $nin: ['로켓그로스', '정글북'],
            },
            count: { $exists: true },
            payCost: { $exists: true },
            wonCost: { $exists: true },
            totalPayment: { $exists: true },
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
          $lookup: {
            from: 'clients',
            as: 'clientInfo',
            localField: 'mallId',
            foreignField: 'name',
          },
        },
        {
          $unwind: {
            path: '$clientInfo',
          },
        },
        {
          $addFields: {
            _id: '$clientInfo._id',
            code: '$clientInfo.code',
            feeRate: '$clientInfo.feeRate',
            name: '$clientInfo.name',
            clientType: '$clientInfo.clientType',
            businessName: '$clientInfo.businessName',
            businessNumber: '$clientInfo.businessNumber',
            inActive: '$clientInfo.inActive',
            payDate: '$clientInfo.payDate',
            isSabangService: '$clientInfo.isSabangService',
          },
        },
        {
          $project: {
            clientInfo: 0,
          },
        },
        {
          $lookup: {
            let: {
              productCode: '$productCode',
              clientCode: '$code',
            },
            from: 'ads',
            as: 'adInfo',
            pipeline: [
              {
                $match: {
                  $or: [
                    {
                      type: AdType.COMPANY_RATE,
                    },
                    {
                      $and: [
                        {
                          type: AdType.CHANNEL_PRODUCT_RATE,
                        },
                        {
                          $expr: {
                            $eq: ['$clientCode', '$$clientCode'],
                          },
                        },
                      ],
                    },
                    {
                      $expr: {
                        $and: [
                          {
                            $in: [
                              '$type',
                              [
                                AdType.CHANNEL_APP_PRODUCT,
                                AdType.CHANNEL_SPECIAL_PRODUCT,
                              ],
                            ],
                          },
                          {
                            $eq: ['$clientCode', '$$clientCode'],
                          },
                          {
                            $in: ['$$productCode', '$productCodeList'],
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                $project: {
                  price: 1,
                  type: 1,
                },
              },
            ],
          },
        },
      ],
    });

    try {
    } catch (err) {
      if (err.codeName == 'NamespaceExists') {
        console.log(`${viewName} 가상 테이블 뷰는 이미 존재합니다.`);
      } else {
        throw err;
      }
    }
  }
}
