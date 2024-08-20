import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AbstractRepository } from 'src/common/database/abstract.repository';
import { Subsidiary } from './entities/subsidiary.entity';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, PipelineStage, Types } from 'mongoose';
import { FindManyInput } from 'src/common/database/types';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { SubsidiariesInput } from './dto/subsidiaries.input';
import { Product } from 'src/product/entities/product.entity';
import { SubsidiaryCategory } from 'src/subsidiary-category/entities/subsidiary-category.entity';
import { UtilService } from 'src/util/util.service';

@Injectable()
export class SubsidiaryRepository extends AbstractRepository<Subsidiary> {
  protected readonly logger = new Logger(SubsidiaryRepository.name);

  constructor(
    private readonly utilService: UtilService,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(SubsidiaryCategory.name)
    private readonly categoryModel: Model<SubsidiaryCategory>,
    @InjectModel(Subsidiary.name) subsidiaryModel: Model<Subsidiary>,
  ) {
    super(subsidiaryModel);
  }

  async findFullManySubsidiary({
    filterQuery,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    skip,
  }: FindManyInput<Subsidiary>) {
    const totalCount = await this.model.countDocuments(filterQuery);
    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    const subsidiaries = await this.model
      .find(filterQuery)
      .populate({ path: 'productList' })
      .populate({ path: 'category' })
      .sort({ [sort]: orderNumber, _id: 1 })
      .limit(limit)
      .skip(skip)
      .lean<Subsidiary[]>();
    return {
      totalCount,
      data: subsidiaries,
    };
  }

  async findFullSubsidiary(filterQuery: FilterQuery<Subsidiary>) {
    const result = await this.model
      .findOne(filterQuery)
      .populate({ path: 'productList' })
      .populate({ path: 'category' })
      .lean<Subsidiary>();

    if (!result) {
      throw new NotFoundException(
        `검색결과가 존재하지 않습니다. ${filterQuery}`,
      );
    }

    return result;
  }

  async findFullManySubsidiaryWithSort({
    sort,
    limit,
    keyword,
    keywordTarget,
    order,
    skip,
  }: SubsidiariesInput) {
    const pipeLine: PipelineStage[] = [
      {
        $facet: {
          data: [
            {
              $lookup: {
                let: {
                  productIdList: '$productList',
                },
                from: 'products',
                as: 'productList',
                pipeline: [
                  {
                    $match: {
                      $expr: [
                        {
                          $in: [
                            '$_id',
                            {
                              $ifNull: ['$$productIdList', []],
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    $project: {
                      name: 1,
                      _id: 1,
                    },
                  },
                ],
              },
            },
            {
              $lookup: {
                from: 'subsidiarycategories',
                localField: 'category',
                foreignField: '_id',
                as: 'category',
              },
            },
            {
              $unwind: '$category',
            },
            {
              $sort: {
                [sort]: order == OrderEnum.DESC ? -1 : 1,
                _id: 1,
              },
            },
            {
              $limit: limit,
            },
            {
              $skip: skip,
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
            $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0],
          },
        },
      },
    ];

    if (keyword) {
      const refTarget = ['category', 'productList'];
      if (refTarget.includes(keywordTarget)) {
        if (keywordTarget == 'category') {
          const categoryList = await this.categoryModel
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
          pipeLine.unshift(matchStage);
        }

        if (keywordTarget == 'productList') {
          const productList = await this.productModel
            .find({
              name: {
                $regex: this.utilService.escapeRegex(keyword),
                $options: 'i',
              },
            })
            .select('_id')
            .lean<{ _id: Types.ObjectId }[]>();

          const productIdList = productList.map((p) => p._id);
          const matchStage = {
            $match: {
              productList: {
                $in: productIdList,
              },
            },
          };
          pipeLine.unshift(matchStage);
        }
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

        pipeLine.unshift(matchStage);
      }
    }
    const result = await this.model.aggregate<{
      totalCount: number;
      data: Subsidiary[];
    }>(pipeLine);

    const totalResult = result[0];

    return {
      totalCount: totalResult.totalCount,
      data: totalResult.data,
    };
  }
}
