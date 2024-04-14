import { Injectable, Logger } from '@nestjs/common';
import { UtilService } from 'src/common/services/util.service';
import { SaleRepository } from './sale.repository';
import { FilterQuery, PipelineStage } from 'mongoose';
import { TopClientOutput } from 'src/client/dtos/top-client.output';
import { Sale } from './entities/sale.entity';
import { SaleInfoList } from 'src/product/dtos/product-sale.output';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
  ) {}

  async topSaleBy(groupId: string) {
    const pipeLine: PipelineStage[] = [
      {
        $match: {
          productCode: { $exists: true },
          mallId: { $exists: true },
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
        },
      },
      {
        $group: {
          _id: `$${groupId}`,
          accPayCost: { $sum: '$payCost' },
          accCount: { $sum: '$count' },
          accWonCost: { $sum: '$wonCost' },
        },
      },
      { $limit: 15 },
      {
        $sort: {
          accPayCost: -1,
        },
      },

      {
        $addFields: {
          name: '$_id',
          accProfit: { $subtract: ['$accPayCost', '$accWonCost'] },
        },
      },
      {
        $project: {
          _id: 0,
          accWonCost: 0,
        },
      },
    ];

    return this.saleRepository.saleModel.aggregate<TopClientOutput[]>(pipeLine);
  }

  async saleBy(filterQuery: FilterQuery<Sale>) {
    const todayFilter = {
      saleAt: this.getDateRangeFilter('today'),
    };

    const thisWeekFilter = {
      saleAt: this.getDateRangeFilter('thisWeek'),
    };

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
          today: this.saleInfoStage(todayFilter),
          thisWeek: this.saleInfoStage(thisWeekFilter),
          clients: this.clientInfoStage(),
        },
      },
    ];
    const result =
      await this.saleRepository.saleModel.aggregate<SaleInfoList>(pipeLine);
    return result;
  }

  private saleInfoStage(
    filterQuery: FilterQuery<Sale>,
    groupId = 'productCode',
  ) {
    return [
      {
        $match: {
          ...filterQuery,
        },
      },
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

  private getDateRangeFilter(rangeOption: 'today' | 'thisWeek') {
    switch (rangeOption) {
      case 'today': {
        const [from, to] = this.utilService.todayDayjsRange();
        return {
          $gte: from.toDate(),
          $lte: to.toDate(),
        };
      }
      case 'thisWeek': {
        const [from, to] = this.utilService.thisWeekDayjsRange();
        return {
          $gte: from.toDate(),
          $lte: to.toDate(),
        };
      }

      default:
        return {};
    }
  }
}
