import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from 'src/product/entities/product.entity';
import { ProductCodeName } from 'src/client/dtos/clients.output';
import * as DataLoader from 'dataloader';

@Injectable()
export class AdProductLoader {
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
        .select(['-_id', 'code', 'name'])
        .lean<ProductCodeName[]>();

      const productMap = new Map<string, ProductCodeName>();

      products.forEach((product) => {
        if (!productMap.has(product.code)) {
          productMap.set(product.code, product);
        }
      });

      return products.map((product) => productMap.get(product.code));
    });
  }
}
