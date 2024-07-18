import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UtilService } from 'src/util/util.service';
import { SaleRepository } from './sale.repository';
import { Connection, FilterQuery, Model, PipelineStage } from 'mongoose';
import { Sale } from './entities/sale.entity';
import { SaleInfo, SaleInfoList } from 'src/product/dtos/product-sale.output';
import { ProductSaleChartOutput } from 'src/product/dtos/product-sale-chart.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DeliveryCost } from './entities/delivery.entity';
import { SaleOutCheck } from './entities/sale.out.check.entity';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as dayjs from 'dayjs';
// import * as ExcelJS from 'exceljs';
// import { ColumnOption } from 'src/client/types';
// import * as sola from 'solapi';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    @InjectModel(SaleOutCheck.name)
    private readonly saleOutCheckModel: Model<SaleOutCheck>,
    @InjectModel(DeliveryCost.name)
    private readonly deliveryCostModel: Model<DeliveryCost>,
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron('0 0 0 * * *')
  async runMorningSale() {
    await this.setCheckSaleOut(false);
  }

  @Cron('0 30 18 * * *')
  async sendMessage() {
    // const apiKey = this.configService.get('SEND_MESSAGE_KEY');
    // const apiSecret = this.configService.get('SEND_MESSAGE_SECRET');
    // const sender = this.configService.get('SENDER');
    // const messageService = new sola.SolapiMessageService(apiKey, apiSecret);
    console.log('send message!');
    // messageService
    //   .send({
    //     text: '사방넷 판매를 전산에서 출고할 시간입니다.',
    //     to: '01039050101',
    //     from: sender,
    //   })
    //   .then(console.log)
    //   .catch(console.error);
  }

  async setCheckSaleOut(checked: boolean) {
    await this.saleOutCheckModel.findOneAndUpdate(
      {},
      { $set: { isChecked: checked } },
      { upsert: true, new: true },
    );
  }

  async saleOutCheck() {
    return this.saleOutCheckModel.findOne({}).lean<SaleOutCheck>();
  }

  async productSale(productCode: string) {
    const [from, to] = this.utilService.monthDayjsRange();
    const pipeLine: PipelineStage[] = [
      {
        $match: {
          orderStatus: '출고완료',
          productCode,
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
          saleAt: {
            $gte: from.toDate(),
            $lte: to.toDate(),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateTrunc: {
              date: '$saleAt',
              unit: 'week',
              startOfWeek: 'monday',
            },
          },
          accPayCost: { $sum: '$payCost' },
          accWonCost: { $sum: '$wonCost' },
        },
      },
      {
        $addFields: {
          accProfit: { $subtract: ['$accPayCost', '$accWonCost'] },
        },
      },
      {
        $project: {
          accWonCost: 0,
        },
      },
      {
        $sort: { _id: 1 },
      },
    ];

    const result =
      await this.saleRepository.saleModel.aggregate<ProductSaleChartOutput>(
        pipeLine,
      );
    return result;
  }

  async totalSale(
    { from, to }: FindDateInput,
    groupId?: string,
    originName: string = 'productName',
    productCodeList?: string[],
    skip: number = 0,
    limit: number = 10,
  ) {
    const _id = groupId ? `$${groupId}` : null;
    const name = originName;

    const pipeline = this.getTotalSalePipeline({
      from,
      to,
      _id,
      name,
      productCodeList,
      skip,
      limit,
    });

    const result = await this.saleRepository.saleModel.aggregate<{
      data: SaleInfo[];
      totalCount: number;
    }>(pipeline);

    return result;
  }

  async saleBy(filterQuery: FilterQuery<Sale>) {
    const pipeLine: PipelineStage[] = [
      {
        $match: {
          orderStatus: '출고완료',
          productCode: { $exists: true },
          mallId: { $exists: true },
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
          ...filterQuery,
        },
      },
      {
        $facet: {
          sales: this.saleInfoStage(),
          clients: this.clientInfoStage(),
        },
      },
    ];
    const result =
      await this.saleRepository.saleModel.aggregate<SaleInfoList>(pipeLine);
    return result;
  }

  private saleInfoStage(groupId = 'productCode') {
    return [
      {
        $group: {
          _id: `$${groupId}`,
          accPayCost: { $sum: '$payCost' },
          accCount: { $sum: '$count' },
          accWonCost: { $sum: '$wonCost' },
        },
      },
      {
        $addFields: {
          name: '$_id',
          accProfit: {
            $subtract: ['$accPayCost', '$accWonCost'],
          },
          averagePayCost: {
            $round: [
              {
                $cond: {
                  if: { $ne: ['$accCount', 0] },
                  then: { $divide: ['$accPayCost', '$accCount'] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          wonCost: 0,
        },
      },
    ];
  }

  private clientInfoStage() {
    const pipeLine: PipelineStage.FacetPipelineStage[] = [
      {
        $group: {
          _id: {
            mallId: '$mallId',
            productCode: '$productCode',
          },
          accPayCost: { $sum: '$payCost' },
          accCount: { $sum: '$count' },
          accWonCost: { $sum: '$wonCost' },
        },
      },
      {
        $sort: {
          accPayCost: -1,
        },
      },
      {
        $addFields: {
          accProfit: {
            $subtract: ['$accPayCost', '$accWonCost'],
          },
          averagePayCost: {
            $round: [
              {
                $cond: {
                  if: { $ne: ['$accCount', 0] },
                  then: { $divide: ['$accPayCost', '$accCount'] },
                  else: 0,
                },
              },
              2,
            ],
          },
        },
      },
      {
        $project: {
          wonCost: 0,
        },
      },
    ];

    return pipeLine;
  }

  private getTotalSalePipeline({
    from,
    to,
    _id,
    name,
    productCodeList,
    skip,
    limit,
  }: {
    from: Date;
    to: Date;
    _id: string;
    name: string;
    productCodeList?: string[];
    skip: number;
    limit: number;
  }): PipelineStage[] {
    if (productCodeList) {
      return [
        {
          $match: {
            orderStatus: '출고완료',
            productCode: { $exists: true, $in: productCodeList },
            mallId: { $exists: true, $nin: ['로켓그로스', '정글북'] },
            count: { $exists: true },
            payCost: { $exists: true },
            wonCost: { $exists: true },
            totalPayment: { $exists: true },
            saleAt: {
              $exists: true,
              $gte: from,
              $lt: to,
            },
          },
        },
        {
          $group: {
            _id,
            name: { $first: name },
            accPayCost: { $sum: '$payCost' },
            accCount: { $sum: '$count' },
            accWonCost: { $sum: '$wonCost' },
            wholeSaleId: { $first: '$wholeSaleId' },
            accDeliveryCost: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$deliveryCost', 0] },
                  '$deliveryBoxCount',
                ],
              },
            },
            accTotalPayment: { $sum: '$totalPayment' },
          },
        },
        {
          $facet: {
            data: [
              {
                $sort: {
                  accCount: -1,
                  accPayCost: -1,
                  _id: -1,
                },
              },
              {
                $skip: skip,
              },
              {
                $limit: limit,
              },
              {
                $project: {
                  wonCost: 0,
                },
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
              $arrayElemAt: ['$totalCount.count', 0],
            },
          },
        },
      ];
    } else {
      return [
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
              $exists: true,
              $gte: from,
              $lt: to,
            },
          },
        },
        {
          $group: {
            _id,
            name: { $first: '$productName' },
            accPayCost: { $sum: '$payCost' },
            accCount: { $sum: '$count' },
            accWonCost: { $sum: '$wonCost' },
            wholeSaleId: { $first: '$wholeSaleId' },
            accDeliveryCost: {
              $sum: {
                $multiply: [
                  { $ifNull: ['$deliveryCost', 0] },
                  '$deliveryBoxCount',
                ],
              },
            },
            accTotalPayment: { $sum: '$totalPayment' },
          },
        },
        {
          $facet: {
            data: [
              {
                $project: {
                  wonCost: 0,
                },
              },
              {
                $sort: {
                  accCount: -1,
                  accPayCost: -1,
                  _id: -1,
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
              $arrayElemAt: ['$totalCount.count', 0],
            },
          },
        },
      ];
    }
  }

  async setDeliveryCost({
    year,
    month,
    monthDeliveryPayCost,
  }: SetDeliveryCostInput) {
    const date = dayjs(new Date(`${year}-${month}-1`));
    const from = date.startOf('month').toDate();
    const to = date.endOf('month').toDate();

    const pipeLine: PipelineStage[] = [
      {
        $match: {
          saleAt: {
            $gte: from,
            $lt: to,
          },
          orderStatus: '출고완료',
          mallId: { $exists: true, $nin: ['로켓그로스', '정글북'] },
          // count: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          count: {
            $sum: '$count',
          },
        },
      },
    ];

    const saleCount = await this.saleRepository.saleModel.aggregate<{
      count: number;
    }>(pipeLine);

    if (!saleCount.length) {
      throw new BadRequestException(
        `${year}년 ${month}월 에는 출고완료된 판매 존재하지 않습니다.`,
      );
    }

    const count = saleCount[0].count;
    const newDeliveryCost = !count //
      ? 0
      : monthDeliveryPayCost / count;
    const result = await this.deliveryCostModel.findOneAndUpdate(
      {},
      {
        $set: {
          deliveryCost: newDeliveryCost,
          year,
          month,
          monthDeliveryPayCost,
        },
      },
      { upsert: true, new: true },
    );

    if (!result) {
      throw new InternalServerErrorException('서버에서 오류가 발생했습니다.');
    }

    return result;
  }

  // async uploadArg(worksheet: ExcelJS.Worksheet) {
  //   const colToField: Record<number, ColumnOption<Sale>> = {
  //     4: {
  //       fieldName: 'shoppingMall',
  //     },
  //     11: {
  //       fieldName: 'deliveryBoxCount',
  //     },
  //   };

  //   const objectList = this.utilService.excelToObject(worksheet, colToField, 2);
  //   const filteredArgList = objectList.filter(
  //     (item) =>
  //       Object.keys(item).length > 0 &&
  //       item.shoppingMall !== '주문번호' &&
  //       item.deliveryBoxCount !== 'SKU 개수',
  //   );

  //   const argListByShoppingMall = new Map<
  //     string,
  //     Pick<Sale, 'shoppingMall' | 'deliveryBoxCount'>
  //   >(filteredArgList.map((f) => [f.shoppingMall, f]));

  //   const matchSaleList = await this.saleRepository.saleModel
  //     .find({
  //       shoppingMall: {
  //         $in: filteredArgList.map((i) => i.shoppingMall).filter((i) => !!i),
  //       },
  //     })
  //     .select(['-_id', 'shoppingMall', 'deliveryBoxCount'])
  //     .lean<Pick<Sale, 'shoppingMall' | 'deliveryBoxCount'>[]>();

  //   const changeBoxCountDocs = matchSaleList
  //     .slice(0, 5)
  //     .map((m) => {
  //       const targetItem = argListByShoppingMall.get(m.shoppingMall);
  //       if (targetItem) {
  //         if (m.deliveryBoxCount !== targetItem.deliveryBoxCount) {
  //           m.deliveryBoxCount = targetItem.deliveryBoxCount;
  //           return m;
  //         }
  //       }
  //     })
  //     .filter((i) => !!i);

  //   const session = await this.connection.startSession();
  //   session.startTransaction();
  //   try {
  //     await this.saleRepository.saleModel.bulkWrite(
  //       changeBoxCountDocs.map((item) => ({
  //         updateOne: {
  //           filter: { shoppingMall: item.shoppingMall },
  //           update: {
  //             $set: {
  //               deliveryBoxCount: item.deliveryBoxCount,
  //             },
  //           },
  //           upsert: true,
  //         },
  //       })),
  //       { session },
  //     );
  //     await session.commitTransaction();
  //   } catch (error) {
  //     await session.abortTransaction();
  //     throw new InternalServerErrorException(
  //       `서버에서 오류가 발생했습니다. ${error.message}`,
  //     );
  //   } finally {
  //     await session.endSession();
  //   }
  // }

  async deliveryCost() {
    return this.deliveryCostModel.findOne().lean<DeliveryCost>();
  }
}
