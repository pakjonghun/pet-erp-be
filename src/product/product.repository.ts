import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Product } from './entities/product.entity';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { ProductsInput } from './dtos/products-input';
import { UtilService } from 'src/util/util.service';
import { ProductSaleInput } from './dtos/product-sale.input';
import { FindManyDTO, OrderEnum } from 'src/common/dtos/find-many.input';
import { Sale } from 'src/sale/entities/sale.entity';
import { ProductSaleMenuOutput } from './dtos/product-sale-menu.output';
import { profit, profitRate, saleCommonMatch } from 'src/common/query/sale';
import { ProductCategory } from 'src/product-category/entities/product-category.entity';
import { Storage } from 'src/storage/entities/storage.entity';

@Injectable()
export class ProductRepository extends AbstractRepository<Product> {
  protected readonly logger = new Logger();

  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Sale.name) private readonly saleModel: Model<Sale>,
    @InjectModel(Product.name) productModel: Model<Product>,
    @InjectModel(ProductCategory.name)
    private readonly productCategoryModel: Model<ProductCategory>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
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

  async getFullProductSort({
    keyword,
    limit,
    skip,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    keywordTarget = 'name',
  }: ProductsInput) {
    let newSort = sort;

    if (sort == 'storage' || sort == 'category') {
      newSort = sort + '.' + 'name';
    }

    const pipelineStage: PipelineStage[] = [
      {
        $facet: {
          data: [
            {
              $lookup: {
                from: 'productcategories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryInfo',
              },
            },
            {
              $addFields: {
                category: {
                  $arrayElemAt: ['$categoryInfo', 0],
                },
                storageObjectId: {
                  $toObjectId: '$storageId',
                },
              },
            },
            {
              $lookup: {
                from: 'storages',
                localField: 'storageObjectId',
                foreignField: '_id',
                as: 'storageInfo',
              },
            },
            {
              $addFields: {
                storage: {
                  $arrayElemAt: ['$storageInfo', 0],
                },
              },
            },
            {
              $project: {
                storageObjectId: 0,
                storageInfo: 0,
                categoryInfo: 0,
              },
            },
            {
              $sort: {
                [newSort]: order == OrderEnum.DESC ? -1 : 1,
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
    ];

    if (keyword) {
      if (keywordTarget !== 'storage' && keywordTarget !== 'category') {
        if (keywordTarget == 'name') {
          const matchStage = {
            $match: {
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
            },
          };
          pipelineStage.unshift(matchStage);
        } else {
          const matchStage = {
            $match: {
              $expr: {
                $regexMatch: {
                  input: { $toString: `$${keywordTarget}` },
                  regex: this.utilService.escapeRegex(keyword),
                  options: 'i',
                },
              },
            },
          };

          pipelineStage.unshift(matchStage);
        }
      } else {
        if (keywordTarget == 'storage') {
          const storageIdList = await this.storageModel
            .find({
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>();

          const storageIdListToString = storageIdList.map((item) =>
            item._id.toHexString(),
          );
          const matchStage = {
            $match: {
              storageId: {
                $in: storageIdListToString,
              },
            },
          };

          pipelineStage.unshift(matchStage);
        } else {
          const categoryList = await this.productCategoryModel
            .find({
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>();

          const categoryIdList = categoryList.map((c) => c._id);

          const matchStage = {
            $match: {
              category: {
                $in: categoryIdList,
              },
            },
          };

          pipelineStage.unshift(matchStage);
        }
      }
    }

    const result = await this.model.aggregate<{
      totalPage: number;
      data: Product;
    }>(pipelineStage);

    return result[0];
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
    productCodeList,
    sort = 'accCount',
    order = -1,
    detailOrder = -1,
    detailSort = 'accCount',
  }: Omit<ProductSaleInput, 'keyword'> & { productCodeList: string[] }) {
    const pipeline: PipelineStage[] = [
      {
        $match: {
          ...saleCommonMatch,
          $expr: {
            $in: ['$productCode', productCodeList],
          },
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
      profit,
      profitRate,
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
              $sort: {
                [sort]: order,
                code: 1,
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
