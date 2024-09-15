import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UtilService } from 'src/util/util.service';
import { SaleRepository } from './sale.repository';
import { Connection, Model, PipelineStage } from 'mongoose';
import { SaleInfo } from 'src/sale/dto/sale.output';
import { ProductSaleChartOutput } from 'src/product/dtos/product-sale-chart.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DeliveryCost } from './entities/delivery.entity';
import { SaleOutCheck } from './entities/sale.out.check.entity';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SaleOrdersInput } from './dto/orders.input';
import { SaleOrdersOutput } from './dto/orders.output';
import { saleCommonMatch } from 'src/common/query/sale';
import { Ad, AdType } from 'src/ad/entities/ad.entity';
import { CommonSaleByInput } from './dto/common-sale.input';
import { Client } from 'src/client/entities/client.entity';
import { ClientDashboardView } from 'src/common/virtualView/ClientDashboardView/ClientDashboardView';
import { CommonSaleMonthAgoInput } from './dto/common-sale-month-ago.input';
import { Product } from 'src/product/entities/product.entity';
import { CommonSaleByMallOutput } from './dto/common-sale.output';
import * as ExcelJS from 'exceljs';
import * as dayjs from 'dayjs';
import { CommonSaleByProductOutput } from './dto/common-sale-by-product.output';
// import { ColumnOption } from 'src/client/types';
// import * as sola from 'solapi';

//전체 광고비를 타입별로 구한다.

//회사 공통 광고비 : 거래처 숫자 나누기 거래처의 판매 제품 숫자만큼 나눈다.
//채널 공통 광고비 : 해당 채널에 할당후, 채널별 제품의 숫자만큼 나눈다.
//채널 제품 광고비 : 광고의 제품중 채널에서 팔린 제품이 있으면 그 제품 숫자만큼 나눈다.

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
    @InjectModel(ClientDashboardView.name)
    private readonly clientDashboardView: Model<ClientDashboardView>,
    @InjectModel(SaleOutCheck.name)
    private readonly saleOutCheckModel: Model<SaleOutCheck>,
    @InjectModel(DeliveryCost.name)
    private readonly deliveryCostModel: Model<DeliveryCost>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,
    @InjectModel(Ad.name)
    private readonly adModel: Model<Ad>,
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
    private readonly configService: ConfigService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Cron('0 0 7 * * *')
  async saveProductRate() {
    const { from, to } = this.utilService.forTeenDayAgoRange();
    await this.clientDashboardView.aggregate([
      {
        $match: {
          saleAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $facet: {
          accTotalPayment: [
            {
              $group: {
                _id: null,
                totalPayment: {
                  $sum: '$totalPayment',
                },
              },
            },
          ],
          products: [
            {
              $group: {
                _id: '$productCode',
                totalPayment: {
                  $sum: '$totalPayment',
                },
              },
            },
          ],
        },
      },
      {
        $unwind: '$accTotalPayment',
      },
      {
        $project: {
          products: {
            $map: {
              input: '$products',
              as: 'product',
              in: {
                productCode: '$$product._id',
                rate: {
                  $ifNull: [
                    {
                      $divide: [
                        '$$product.totalPayment',
                        '$accTotalPayment.totalPayment',
                      ],
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$products',
      },
      {
        $project: {
          productCode: '$products.productCode',
          rate: '$products.rate',
        },
      },
      {
        $out: 'productRate',
      },
    ]);
  }

  @Cron('0 0 7 * * *')
  async saveClientProductRate() {
    const { from, to } = this.utilService.forTeenDayAgoRange();
    await this.clientDashboardView.aggregate([
      {
        $match: {
          saleAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: {
            mallId: '$mallId',
            productCode: '$productCode',
          },
          totalPayment: {
            $sum: '$totalPayment',
          },
        },
      },
      {
        $group: {
          _id: '$_id.mallId',

          accTotalPayment: { $sum: '$totalPayment' },
          products: {
            $push: {
              productCode: '$_id.productCode',
              totalPayment: '$totalPayment',
            },
          },
        },
      },
      {
        $addFields: {
          clientCode: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
          clientCode: 1,
          products: {
            $map: {
              input: '$products',
              as: 'product',
              in: {
                productCode: '$$product.productCode',
                rate: {
                  $cond: {
                    if: { $eq: ['$accTotalPayment', 0] },
                    then: 0,
                    else: {
                      $divide: ['$$product.totalPayment', '$accTotalPayment'],
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $unwind: '$products',
      },
      {
        $project: {
          clientCode: '$clientCode',
          productCode: '$products.productCode',
          rate: '$products.rate',
        },
      },
      {
        $out: 'clientProductRate',
      },
    ]);
  }

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

  async commonMonthSaleByMall({ from, mallId }: CommonSaleMonthAgoInput) {
    const { from: monthFrom, to: monthTo } =
      this.utilService.getBeforeMonthDate(from);

    const pipeLine: PipelineStage[] = [
      {
        $match: {
          ...saleCommonMatch,
          saleAt: {
            $gte: monthFrom,
            $lte: monthTo,
          },
          mallId,
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
        $sort: {
          accCount: -1,
        },
      },
    ];

    const result = await this.saleRepository.saleModel.aggregate(pipeLine);
    return result[0];
  }

  async commonSaleByMall(commonSaleInput: CommonSaleByInput) {
    //회사공통 : 모든채널에 광고비 / (거래처숫자*거래처별 제품숫자)
    //채널공통 : 해당채널에만  광고비 / 채널 제품숫자
    //채널제품 : 해당채널의 해당 제품만 광고비 / (광고의 제품목록 , 목록과 같은 제품숫자)

    //채널별 제품숫자, 채널광고여부, 채널제품광고여부
    //채널제품 광고리스트,

    const pipeLine = this.commonSaleByMallId(commonSaleInput);
    const result =
      await this.saleRepository.saleModel.aggregate<CommonSaleByMallOutput>(
        pipeLine,
      );

    return result;
  }

  commonSaleByMallId({ from, to }: CommonSaleByInput): PipelineStage[] {
    return [
      {
        $match: {
          saleAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: {
            mallId: '$mallId',
            productCode: '$productCode',
          },
          productName: { $first: '$productName' },
          accCount: { $sum: '$count' },
          accTotalPayment: { $sum: '$totalPayment' },
          accWonCost: { $sum: '$wonCost' },
          accPayCost: { $sum: '$payCost' },
          accDeliveryCost: { $sum: '$deliveryCost' },
        },
      },
      {
        $group: {
          _id: '$_id.mallId',
          products: {
            $push: {
              ads: '$ads',
              name: '$productName',
              accCount: '$accCount',
              accTotalPayment: '$accTotalPayment',
              accWonCost: '$accWonCost',
              accPayCost: '$accPayCost',
              accDeliveryCost: '$accDeliveryCost',
            },
          },
        },
      },
      {
        $addFields: {
          products: {
            $sortArray: {
              input: '$products',
              sortBy: { accCount: -1, id: 1 },
            },
          },
        },
      },
    ];
  }

  async commonSaleByProduct(commonSaleInput: CommonSaleByInput) {
    const pipeLine = this.commonSaleByProductCode(commonSaleInput);
    const result =
      await this.saleRepository.saleModel.aggregate<CommonSaleByProductOutput>(
        pipeLine,
      );

    return result;
  }

  commonSaleByProductCode({ from, to }: CommonSaleByInput): PipelineStage[] {
    return [
      {
        $match: {
          saleAt: {
            $gte: from,
            $lte: to,
          },
        },
      },
      {
        $group: {
          _id: {
            productCode: '$productCode',
            mallId: '$mallId',
          },
          mallId: { $first: '$mallId' },
          accCount: { $sum: '$count' },
          accTotalPayment: { $sum: '$totalPayment' },
          accWonCost: { $sum: '$wonCost' },
          accPayCost: { $sum: '$payCost' },
          accDeliveryCost: { $sum: '$deliveryCost' },
        },
      },
      {
        $group: {
          _id: '$_id.productCode',
          clients: {
            $push: {
              name: '$mallId',
              accCount: '$accCount',
              accTotalPayment: '$accTotalPayment',
              accWonCost: '$accWonCost',
              accPayCost: '$accPayCost',
              accDeliveryCost: '$accDeliveryCost',
            },
          },
        },
      },
      {
        $addFields: {
          clients: {
            $sortArray: {
              input: '$clients',
              sortBy: { accCount: -1, id: 1 },
            },
          },
        },
      },
    ];
  }

  async orders(saleOrdersInput: SaleOrdersInput) {
    const {
      from = null,
      to = null,
      skip = 0,
      limit = 10,
      sort = 'saleAt',
      order = -1,
      orderNumber = '',
      mallId = '',
      productName = '',
    } = saleOrdersInput;

    const orderNumberKeyword = this.utilService.escapeRegex(orderNumber ?? '');
    const mallIdKeyword = this.utilService.escapeRegex(mallId ?? '');
    const productNameKeyword = this.utilService.escapeRegex(productName ?? '');

    const result =
      await this.saleRepository.saleModel.aggregate<SaleOrdersOutput>([
        {
          $match: {
            mallId: {
              $regex: mallIdKeyword,
              $options: 'i',
            },
            orderNumber: {
              $regex: orderNumberKeyword,
              $options: 'i',
            },
            $or: [
              {
                productName: {
                  $regex: productNameKeyword,
                  $options: 'i',
                },
              },
              {
                productCode: {
                  $regex: productNameKeyword,
                  $options: 'i',
                },
              },
            ],
            saleAt: {
              $gte: from ?? new Date(-8640000000000),
              $lt: to ?? new Date(8640000000000),
            },
          },
        },
        {
          $facet: {
            total: [
              {
                $group: {
                  _id: null,
                  accCount: { $sum: '$count' },
                  accTotalPayment: { $sum: '$totalPayment' },
                  accWonCost: { $sum: '$wonCost' },
                  accPayCost: { $sum: '$payCost' },
                  accDeliveryCost: { $sum: '$deliveryCost' },
                },
              },
            ],
            data: [
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
            total: {
              $arrayElemAt: ['$total', 0],
            },
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
      ]);
    return result[0];

    // .find({
    //   mallId: {},
    // })
    // .skip(skip)
    // .limit(limit)
    // .sort({ saleAt: -1, mallId: 1 });
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

  async totalSale({ from, to }: FindDateInput) {
    const pipeline = this.getTotalSalePipeline({
      from,
      to,
    });

    const result =
      await this.saleRepository.saleModel.aggregate<SaleInfo>(pipeline);

    const adResult = await this.getAdPrice({ from, to });
    const accAdPrice = adResult[0]?.accAdPrice ?? 0;
    const saleResult = result[0] ?? { accAdPrice };
    saleResult.accAdPrice = accAdPrice;

    return saleResult;
  }

  async getAdPrice({ from, to }: FindDateInput) {
    const pipeLine = this.getAdTotalPipeLine({ from, to });
    pipeLine.push({
      $group: {
        _id: null,
        accAdPrice: {
          $sum: '$accAdPrice',
        },
      },
    });
    const adResult = await this.adModel.aggregate<{ accAdPrice: number }>(
      pipeLine,
    );
    return adResult;
  }

  async getAdPriceByType({ from, to }: FindDateInput) {
    const pipeLine = this.getAdTotalPipeLine({ from, to });
    pipeLine.push({
      $group: {
        _id: '$type',
        accAdPrice: {
          $sum: '$accAdPrice',
        },
      },
    });
    const adResult = await this.adModel.aggregate<{
      _id: AdType;
      accAdPrice: number;
    }>(pipeLine);
    return adResult;
  }

  private getAdTotalPipeLine({ from, to }: FindDateInput): PipelineStage[] {
    return [
      {
        $match: {
          from: {
            $lte: to,
          },
          to: {
            $gte: from,
          },
        },
      },
      {
        $addFields: {
          fromRange: {
            $cond: {
              if: { $gte: ['$from', from] },
              then: '$from',
              else: from,
            },
          },
          toRange: {
            $cond: {
              if: { $lte: ['$to', to] },
              then: '$to',
              else: to,
            },
          },
          totalDateRange: {
            $add: [
              {
                $dateDiff: {
                  startDate: '$from',
                  endDate: '$to',
                  unit: 'day',
                },
              },
              1,
            ],
          },
        },
      },
      {
        $addFields: {
          dayAdPrice: {
            $divide: ['$price', '$totalDateRange'],
          },
          range: {
            $cond: {
              if: {
                $eq: [
                  {
                    $ifNull: [
                      {
                        $dateDiff: {
                          startDate: '$fromRange',
                          endDate: '$toRange',
                          unit: 'day',
                        },
                      },
                      1,
                    ],
                  },
                  0,
                ],
              },
              then: 1,
              else: {
                $ifNull: [
                  {
                    $dateDiff: {
                      startDate: '$fromRange',
                      endDate: '$toRange',
                      unit: 'day',
                    },
                  },
                  1,
                ],
              },
            },
          },
        },
      },
      {
        $addFields: {
          accAdPrice: {
            $multiply: ['$dayAdPrice', '$range'],
          },
        },
      },
      {
        $project: {
          type: 1,
          accAdPrice: 1,
        },
      },
    ];
  }

  private getTotalSalePipeline({
    from,
    to,
  }: {
    from: Date;
    to: Date;
  }): PipelineStage[] {
    return [
      {
        $match: {
          ...saleCommonMatch,
          saleAt: {
            $exists: true,
            $gte: from,
            $lt: to,
          },
        },
      },
      {
        $group: {
          _id: null,
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
    ];
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

  async deliveryCost() {
    return this.deliveryCostModel.findOne().lean<DeliveryCost>();
  }

  async totalSaleBy({ from, to }: FindDateInput) {
    const data = await this.totalSale({ from, to });
    return data;
  }

  async downloadExcel(saleOrdersInput: SaleOrdersInput) {
    const findSaleOrders = await this.orders(saleOrdersInput);
    const allData = findSaleOrders.data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = [
      { header: '거래처', key: 'mallId', width: 30 },
      { header: '제품명', key: 'productName', width: 30 },
      { header: '제품코드', key: 'productCode', width: 30 },
      { header: '판매수', key: 'count', width: 10 },
      { header: '바코드', key: 'barCode', width: 20 },
      { header: '주소', key: 'address1', width: 100 },
      { header: '연락처', key: 'telephoneNumber1', width: 30 },
      { header: '메세지', key: 'message', width: 50 },
      { header: '매출', key: 'totalPayment', width: 20 },
      { header: '정산금액', key: 'payCost', width: 20 },
      { header: '원가', key: 'wonCost', width: 20 },
      { header: '택배비용', key: 'deliveryCost', width: 20 },
      { header: '주문날짜', key: 'saleAt', width: 20 },
      { header: '주문확인날짜', key: 'orderConfirmedAt', width: 20 },
      { header: '주문번호', key: 'orderNumber', width: 20 },
    ];

    for (const doc of allData) {
      const newDoc = {
        ...doc,
        saleAt: dayjs(doc.saleAt).format('YYYY-MM-DD HH:mm'),
      };
      worksheet.addRow(newDoc);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
