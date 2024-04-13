import { Injectable, Logger } from '@nestjs/common';
import { UtilService } from 'src/common/services/util.service';
import { SaleRepository } from './sale.repository';
import { TopSaleByGroup } from './types';
import { PipelineStage } from 'mongoose';
import { TopClientOutput } from 'src/client/dtos/top-client.output';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    private readonly utilService: UtilService,
    private readonly saleRepository: SaleRepository,
  ) {}

  async topSaleBy({ groupId, limit }: TopSaleByGroup) {
    const pipeLine: PipelineStage[] = [
      {
        $match: {
          mallId: { $exists: true },
          count: { $gt: 0 },
          payCost: { $gt: 0 },
          wonCost: { $gt: 0 },
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
        $sort: {
          payCost: -1,
          _id: 1,
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
      {
        $limit: limit,
      },
    ];

    return this.saleRepository.saleModel.aggregate<TopClientOutput[]>(pipeLine);
  }
}
