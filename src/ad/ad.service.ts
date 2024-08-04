import { Injectable } from '@nestjs/common';
import { CreateAdInput } from './dto/create-ad.input';
import { UpdateAdInput } from './dto/update-ad.input';
import { AdRepository } from './ad.repository';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { AdsInput } from './dto/ads.input';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { Product } from 'src/product/entities/product.entity';
import { Ad } from './entities/ad.entity';
import { Client } from 'src/client/entities/client.entity';

@Injectable()
export class AdService {
  constructor(
    private readonly adRepository: AdRepository,
    private readonly utilService: UtilService,

    @InjectModel(Client.name)
    private readonly clientModel: Model<Client>,

    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(createFactoryInput: CreateAdInput) {
    return this.adRepository.create(createFactoryInput);
  }

  async findMany({ keyword, skip, limit, from, to, type }: AdsInput) {
    const productList = await this.productModel
      .find({
        name: {
          $regex: this.utilService.escapeRegex(keyword),
          $options: 'i',
        },
      })
      .select(['code', '-_id'])
      .lean<{ code: string }[]>();
    const productCodeList = productList.map((product) => {
      return product.code;
    });

    const clientList = await this.clientModel
      .find({
        name: {
          $regex: this.utilService.escapeRegex(keyword),
          $options: 'i',
        },
      })
      .select(['code', '-_id'])
      .lean<{ code: string }[]>();
    const clientCodeList = clientList.map((client) => {
      return client.code;
    });

    const filterQuery: FilterQuery<Ad> = {
      $or: [
        {
          productCodeList: {
            $exists: true,
            $elemMatch: {
              $in: productCodeList,
            },
          },
        },
        {
          clientCode: {
            $exists: true,
            $in: clientCodeList,
          },
        },
        { from: { $gte: from, $lte: to } },
        { to: { $gte: from, $lte: to } },
        {
          $and: [
            {
              from: { $lte: from },
            },
            {
              to: { $gte: to },
            },
          ],
        },
      ],
      type: {
        $regex: this.utilService.escapeRegex(type ?? ''),
      },
    };
    return this.adRepository.findMany({
      filterQuery,
      skip,
      limit,
      order: OrderEnum.DESC,
      sort: 'updatedAt',
    });
  }

  async update({ _id, ...body }: UpdateAdInput) {
    return this.adRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const result = await this.adRepository.remove({ _id });
    return result;
  }
}
