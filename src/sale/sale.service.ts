import { Injectable, Logger } from '@nestjs/common';
import { UtilService } from 'src/common/services/util.service';
import { SaleRepository } from './sale.repository';
import { FilterQuery, PipelineStage } from 'mongoose';
import { TopClientOutput } from 'src/client/dtos/top-client.output';
import { Sale } from './entities/sale.entity';
import { SaleInfoList } from 'src/product/dtos/product-sale.output';
import { TopClientInput } from 'src/client/dtos/top-client.input';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
  ) {}

  async topSaleBy(groupId: string, { skip, limit }: TopClientInput) {
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
        $facet: {
          totalCount: [
            {
              $group: {
                _id: `$${groupId}`,
              },
            },
            {
              $count: 'totalCount',
            },
          ],
          data: [
            {
              $group: {
                _id: `$${groupId}`,
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
            { $skip: skip },
            { $limit: limit },
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
          ],
        },
      },
      {
        $unwind: '$totalCount',
      },
      {
        $replaceRoot: {
          newRoot: {
            totalCount: '$totalCount.totalCount',
            data: '$data',
          },
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

    const lastWeekFilter = {
      saleAt: this.getDateRangeFilter('lastWeek'),
    };

    const thisMonthFilter = {
      saleAt: this.getDateRangeFilter('thisMonth'),
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
          lastWeek: this.saleInfoStage(lastWeekFilter),
          thisMonth: this.saleInfoStage(thisMonthFilter),
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

  private getDateRangeFilter(
    rangeOption: 'today' | 'thisWeek' | 'lastWeek' | 'thisMonth',
  ) {
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

      case 'lastWeek': {
        const [from, to] = this.utilService.lastWeekDayjsRange();
        return {
          $gte: from.toDate(),
          $lte: to.toDate(),
        };
      }

      case 'thisMonth': {
        const [from, to] = this.utilService.thisMonthDayjsRange();
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
