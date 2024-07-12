import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UtilService } from 'src/util/util.service';
import { SaleRepository } from './sale.repository';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { Sale } from './entities/sale.entity';
import { SaleInfo, SaleInfoList } from 'src/product/dtos/product-sale.output';
import { ProductSaleChartOutput } from 'src/product/dtos/product-sale-chart.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';
import { SetDeliveryCostInput } from './dto/delivery-cost.Input';
import { InjectModel } from '@nestjs/mongoose';
import { DeliveryCost } from './entities/delivery.entity';
import { SaleOutCheck } from './entities/sale.out.check.entity';
import * as dayjs from 'dayjs';
import { Cron } from '@nestjs/schedule';

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
  ) {}

  @Cron('0 0 0 * * *')
  async runMorningSale() {
    await this.setCheckSaleOut(false);
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
            mallId: { $exists: true, $ne: '로켓그로스' },
            count: { $exists: true },
            payCost: { $exists: true },
            wonCost: { $exists: true },
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
            deliveryCost: { $sum: { $ifNull: ['$deliveryCost', 0] } },
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
          $facet: {
            data: [
              {
                $sort: {
                  accPayCost: -1,
                  accCount: -1,
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
            mallId: { $exists: true, $ne: '로켓그로스' },
            count: { $exists: true },
            payCost: { $exists: true },
            wonCost: { $exists: true },
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
            deliveryCost: { $sum: { $ifNull: ['$deliveryCost', 0] } },
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
          $facet: {
            data: [
              {
                $project: {
                  wonCost: 0,
                },
              },
              {
                $sort: {
                  accPayCost: -1,
                  accCount: -1,
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
          mallId: { $ne: '로켓그로스' },
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
}
