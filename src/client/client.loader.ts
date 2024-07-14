import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as DataLoader from 'dataloader';
import { Product } from 'src/product/entities/product.entity';

type ProductCodeName = Pick<Product, 'code' | 'name'>;

@Injectable()
export class ClientLoader {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  createLoader(): DataLoader<string, ProductCodeName> {
    return new DataLoader(async (productCodeList) => {
      const products = await this.productModel
        .find({
          code: {
            $in: productCodeList,
          },
        })
        .select(['code', 'name'])
        .lean<ProductCodeName[]>();

      const productByCode = new Map<string, ProductCodeName>(
        products.map((p) => [p.code, p]),
      );

      if (products.length == 0) {
        return productCodeList.map((item) => ({
          code: item,
          name: item,
        })) as ProductCodeName[];
      }

      const result = productCodeList.map(
        (code) => productByCode.get(code) ?? { code: '', name: '' },
      );
      return result;
    });
  }
}
