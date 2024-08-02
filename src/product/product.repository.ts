import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Product } from './entities/product.entity';
import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { ProductsInput } from './dtos/products-input';
import { UtilService } from 'src/util/util.service';
import { ProductSaleInput } from './dtos/product-sale.input';
import { FindManyDTO } from 'src/common/dtos/find-many.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { ProductSaleMenuOutput } from './dtos/product-sale-menu.output';

@Injectable()
export class ProductRepository extends AbstractRepository<Product> {
  protected readonly logger = new Logger();

  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Product.name) productModel: Model<Product>,
  ) {
    super(productModel);
  }

  async findFullOneProduct(query: FilterQuery<Product>) {
    const result = await this.model
      .findOne(query)
      .populate({
        path: 'category',
        select: ['_id', 'name'],
      })
      .lean<Product>();
    return result;
  }

  async findFullManyProducts({ keyword, limit, skip }: ProductsInput) {
    const escapedKeyword = this.utilService.escapeRegex(keyword);
    const filterQuery: FilterQuery<Product> = {
      $or: [
        { name: { $regex: escapedKeyword, $options: 'i' } },
        { code: { $regex: escapedKeyword, $options: 'i' } },
      ],
    };
    const totalCount = await this.model.countDocuments(filterQuery);
    const data = await this.model
      .find(filterQuery)
      .populate({
        path: 'category',
        select: ['_id', 'name'],
      })
      .sort({ createdAt: -1, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<Product[]>();

    return { totalCount, data };
  }

  async productCodeList(keyword: Pick<FindManyDTO, 'keyword'>['keyword']) {
    const productFilterQuery: FilterQuery<Product> = {
      $or: [
        {
          name: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          code: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
      ],
    };

    const productCodeList = await this.model
      .find(productFilterQuery)
      .select({ code: 1, _id: 0 })
      .lean<Pick<Product, 'code'>[]>();
    return productCodeList.map((item) => item.code);
  }

  async salesByProduct({
    from,
    to,
    skip,
    limit,
    productCodeList,
  }: Omit<ProductSaleInput, 'keyword'> & { productCodeList: string[] }) {
    const prevDate = this.utilService.getBeforeDate({ from, to });
    const pipeline: PipelineStage[] = [
      {
        $match: {
          orderStatus: '출고완료',
          productCode:
            productCodeList.length > 0
              ? {
                  $exists: true,
                  $in: productCodeList,
                }
              : {
                  $exists: true,
                },
          count: { $exists: true },
          payCost: { $exists: true },
          wonCost: { $exists: true },
          totalPayment: { $exists: true },
          saleAt: {
            $gte: from,
            $lt: to,
          },
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
        $group: {
          _id: '$productCode',
          accTotalPayment: {
            $sum: '$totalPayment',
          },
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
              $multiply: [
                { $ifNull: ['$deliveryCost', 0] },
                '$deliveryBoxCount',
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: 'products',
          as: 'product_info',
          foreignField: 'code',
          localField: '_id',
        },
      },
      {
        $unwind: {
          path: '$product_info',
        },
      },
      {
        $addFields: {
          _id: '$product_info._id',
          code: '$product_info.code',
          barCode: '$product_info.barCode',
          name: '$product_info.name',
          wonPrice: '$product_info.wonPrice',
          leadTime: '$product_info.leadTime',
          salePrice: '$product_info.salePrice',
          isFreeDeliveryFee: '$product_info.isFreeDeliveryFee',
        },
      },
      {
        $project: {
          product_info: 0,
        },
      },
      {
        $facet: {
          data: [
            {
              $lookup: {
                from: 'stocks',
                localField: '_id',
                foreignField: 'product',
                as: 'stock_info',
              },
            },
            {
              $addFields: {
                stock: {
                  $reduce: {
                    input: '$stock_info',
                    initialValue: 0,
                    in: {
                      $add: ['$$value', '$$this.count'],
                    },
                  },
                },
              },
            },
            {
              $addFields: {
                totalAssetCost: {
                  $ifNull: [{ $multiply: ['$stock', '$wonPrice'] }, 0],
                },
              },
            },
            {
              $project: {
                stock_info: 0,
              },
            },
            {
              $lookup: {
                let: {
                  productId: '$_id',
                },
                from: 'productorders',
                as: 'order_info',
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          {
                            $eq: ['$isDone', false],
                          },
                          {
                            $in: ['$$productId', '$products.product'],
                          },
                        ],
                      },
                    },
                  },
                  {
                    $project: {
                      orderDate: 1,
                      products: 1,
                    },
                  },
                  {
                    $unwind: '$products',
                  },
                  {
                    $lookup: {
                      from: 'products',
                      as: 'product_info',
                      localField: 'products.product',
                      foreignField: '_id',
                    },
                  },
                  {
                    $unwind: '$product_info',
                  },
                ],
              },
            },
            {
              $addFields: {
                maxLeadTime: {
                  $max: '$order_info.product_info.leadTime',
                },
                orderDate: {
                  $ifNull: [
                    {
                      $first: '$order_info.orderDate',
                    },
                    null,
                  ],
                },
              },
            },
            {
              $addFields: {
                recentCreateDate: {
                  $cond: {
                    if: {
                      $eq: ['$orderDate', null],
                    },
                    then: '발주 없음',
                    else: {
                      $cond: {
                        if: {
                          $eq: ['$maxLeadTime', null],
                        },
                        then: '리드타임 미입력',
                        else: {
                          $dateToString: {
                            format: '%Y-%m-%d',
                            date: {
                              $dateAdd: {
                                startDate: '$orderDate',
                                unit: 'day',
                                amount: '$maxLeadTime',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            {
              $project: {
                order_info: 0,
                orderDate: 0,
                maxLeadTime: 0,
              },
            },
            {
              $lookup: {
                let: {
                  productCode: '$code',
                },
                from: 'sales',
                as: 'clients',
                pipeline: [
                  {
                    $match: {
                      orderStatus: '출고완료',
                      mallId: { $exists: true, $nin: ['로켓그로스', '정글북'] },
                      count: { $exists: true },
                      payCost: { $exists: true },
                      wonCost: { $exists: true },
                      totalPayment: { $exists: true },
                      saleAt: {
                        $gte: from,
                        $lt: to,
                      },
                      $expr: {
                        $eq: ['$productCode', '$$productCode'],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: '$mallId',
                      accCount: {
                        $sum: '$count',
                      },
                      accPayCost: {
                        $sum: '$payCost',
                      },
                      accWonCost: {
                        $sum: '$wonCost',
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
                    $addFields: {
                      name: '$_id',
                    },
                  },

                  {
                    $sort: {
                      accCount: -1,
                      _id: 1,
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                let: {
                  productCode: '$code',
                },
                from: 'sales',
                as: 'prevSales',
                pipeline: [
                  {
                    $match: {
                      orderStatus: '출고완료',
                      mallId: { $exists: true, $nin: ['로켓그로스', '정글북'] },
                      count: { $exists: true },
                      payCost: { $exists: true },
                      wonCost: { $exists: true },
                      totalPayment: { $exists: true },
                      saleAt: {
                        $gte: prevDate.from,
                        $lt: prevDate.to,
                      },
                      $expr: {
                        $eq: ['$productCode', '$$productCode'],
                      },
                    },
                  },
                  {
                    $group: {
                      _id: null,
                      accTotalPayment: {
                        $sum: '$totalPayment',
                      },
                      accCount: {
                        $sum: '$count',
                      },
                      accPayCost: {
                        $sum: '$payCost',
                      },
                      accWonCost: {
                        $sum: '$wonCost',
                      },
                      accDeliveryCost: {
                        $sum: {
                          $multiply: [
                            { $ifNull: ['$deliveryCost', 0] },
                            '$deliveryBoxCount',
                          ],
                        },
                      },
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                prevSale: {
                  $arrayElemAt: ['$prevSales', 0],
                },
              },
            },
            {
              $addFields: {
                prevAccTotalPayment: '$prevSale.accTotalPayment',
                prevAccCount: '$prevSale.accCount',
                prevAccPayCost: '$prevSale.accPayCost',
                prevAccWonCost: '$prevSale.accWonCost',
                prevAccDeliveryCost: '$prevSale.accDeliveryCost',
              },
            },
            {
              $project: {
                prevSales: 0,
                prevSale: 0,
              },
            },
            {
              $sort: {
                accCount: -1,
                code: 1,
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
        $project: {
          data: 1,
          totalCount: {
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
        },
      },
    ];

    const result =
      await this.saleModel.aggregate<ProductSaleMenuOutput>(pipeline);

    return result?.[0];
  }
}
