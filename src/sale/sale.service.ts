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
import { SaleInfo, SaleInfoList } from 'src/sale/dto/sale.output';
import { ProductSaleChartOutput } from 'src/product/dtos/product-sale-chart.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { DeliveryCost } from './entities/delivery.entity';
import { SaleOutCheck } from './entities/sale.out.check.entity';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SaleOrdersInput } from './dto/orders.input';
import * as dayjs from 'dayjs';
import { SaleOrdersOutput } from './dto/orders.output';
import * as ExcelJS from 'exceljs';
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
    console.log('result : ', result);
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
  }: {
    from: Date;
    to: Date;
  }): PipelineStage[] {
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
    const prevRange = this.utilService.getBeforeDate({
      from,
      to,
    });

    const current = await this.totalSale({ from, to });
    const previous = await this.totalSale(prevRange);

    return { current: current?.[0], previous: previous?.[0] };
  }

  async downloadExcel(saleOrdersInput: SaleOrdersInput) {
    const findSaleOrders = await this.orders(saleOrdersInput);
    const allData = findSaleOrders.data;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    worksheet.columns = [
      { header: '거래처', key: 'mallId', width: 100 },
      { header: '제품명', key: 'productName', width: 100 },
      { header: '제품코드', key: 'productCode', width: 100 },
      { header: '판매수', key: 'count', width: 100 },
      { header: '바코드', key: 'barCode', width: 100 },
      { header: '주소', key: 'address1', width: 100 },
      { header: '연락처', key: 'telephoneNumber1', width: 100 },
      { header: '메세지', key: 'message', width: 100 },
      { header: '매출', key: 'totalPayment', width: 100 },
      { header: '정산금액', key: 'payCost', width: 100 },
      { header: '원가', key: 'wonCost', width: 100 },
      { header: '택배비용', key: 'deliveryCost', width: 100 },
      { header: '주문날짜', key: 'saleAt', width: 100 },
      { header: '주문확인날짜', key: 'orderConfirmedAt', width: 100 },
      { header: '주문번호', key: 'orderNumber', width: 100 },
    ];

    for (const doc of allData) {
      worksheet.addRow(doc);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }
}
