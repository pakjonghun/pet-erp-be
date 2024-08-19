import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { CLIENT_DASHBOARD_VIEW } from './constants';

@Injectable()
export class ClientDashboardView implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    await this.createClientDashboardView();
  }

  async createClientDashboardView() {
    const db = this.connection.db;

    // 뷰가 이미 존재하는지 확인
    const viewExists = await db
      .listCollections({ name: CLIENT_DASHBOARD_VIEW })
      .hasNext();

    if (viewExists) {
      console.log(`${CLIENT_DASHBOARD_VIEW} 가 이미 존재합니다.`);
      return;
    }
    // await db.collection(CLIENT_DASHBOARD_VIEW).drop();

    console.log(`${CLIENT_DASHBOARD_VIEW}기존 뷰가 삭제되고 새로 생성됩니다.`);
    await db.createCollection(CLIENT_DASHBOARD_VIEW, {
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
            saleAt: 1,
            productName: 1,
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
            from: 'productRate',
            localField: 'productCode',
            foreignField: 'productCode',
            as: 'productRate',
            pipeline: [
              {
                $project: {
                  _id: 0,
                  productCode: 0,
                },
              },
            ],
          },
        },
        {
          $unwind: '$productRate',
        },
        {
          $addFields: {
            productRate: '$productRate.rate',
          },
        },
        {
          $lookup: {
            let: {
              productCode: '$productCode',
            },
            from: 'clientProductRate',
            foreignField: 'clientCode',
            localField: 'name',
            as: 'clientProductRate',
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$productCode', '$$productCode'],
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  clientCode: 0,
                },
              },
            ],
          },
        },
        {
          $addFields: {
            clientProductRate: {
              $ifNull: [{ $arrayElemAt: ['$clientProductRate.rate', 0] }, 0],
            },
          },
        },
      ],
    });

    try {
    } catch (err) {
      if (err.codeName == 'NamespaceExists') {
        console.log(
          `${CLIENT_DASHBOARD_VIEW} 가상 테이블 뷰는 이미 존재합니다.`,
        );
      } else {
        throw err;
      }
    }
  }
}
