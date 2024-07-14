import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OutProduct } from './dto/options.output';
import { Product } from 'src/product/entities/product.entity';
import * as DataLoader from 'dataloader';

@Injectable()
export class OptionLoader {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  createLoader(): DataLoader<string, OutProduct> {
    return new DataLoader(async (productCodeList) => {
      const productList = await this.productModel
        .find({
          code: { $in: productCodeList },
        })
        .select(['-_id', 'code', 'name'])
        .lean<OutProduct[]>();

      const productByCode = new Map<string, OutProduct>(
        productList.map((p) => [p.code, p]),
      );

      productCodeList.forEach((productCode) => {
        if (!productByCode.has(productCode)) {
          productByCode.set(productCode, { code: productCode, name: '' });
        }
      });

      return productCodeList.map((productCode) =>
        productByCode.get(productCode),
      );
    });
  }
}
