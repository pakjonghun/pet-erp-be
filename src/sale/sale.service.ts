import { Injectable, Logger } from '@nestjs/common';
import { UtilService } from 'src/common/services/util.service';
import { SaleRepository } from './sale.repository';
import { FilterQuery, PipelineStage } from 'mongoose';
import { Sale } from './entities/sale.entity';
import { SaleInfo, SaleInfoList } from 'src/product/dtos/product-sale.output';
import { ProductSaleChartOutput } from 'src/product/dtos/product-sale-chart.output';
import { FindDateInput } from 'src/common/dtos/find-date.input';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
  ) {}

  async productSale(productCode: string) {
    const [from, to] = this.utilService.monthDayjsRange();
    const pipeLine: PipelineStage[] = [
      {
        $match: {
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
  ) {
    const _id = groupId ? `$${groupId}` : null;
    const name = `$${originName}`;
    const pipeline = this.getTotalSalePipeline({
      from,
      to,
      _id,
      name,
    });

    return this.saleRepository.saleModel.aggregate<SaleInfo>(pipeline);
  }

  async saleBy(filterQuery: FilterQuery<Sale>) {
    const pipeLine: PipelineStage[] = [
      {
        $match: {
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
  }: {
    from: Date;
    to: Date;
    _id: string;
    name: string;
  }): PipelineStage[] {
    return [
      {
        $match: {
          productCode: { $exists: true },
          mallId: { $exists: true },
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
          saleAt: {
            $exists: true,
            $gte: from,
            $lte: to,
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
        $sort: {
          accPayCost: -1,
          accCount: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          wonCost: 0,
        },
      },
    ];
  }
}
