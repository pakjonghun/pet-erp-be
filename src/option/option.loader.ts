import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OutOptionProduct, OutProduct } from './dto/options.output';
import { Product } from 'src/product/entities/product.entity';
import * as DataLoader from 'dataloader';
import { OptionProduct } from './entities/option.entity';

@Injectable()
export class OptionLoader {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  createLoader(): DataLoader<OptionProduct, OutOptionProduct> {
    return new DataLoader(async (productOptionList) => {
      const productList = await this.productModel
        .find({
          code: { $in: productOptionList.map((o) => o.productCode) },
        })
        .select(['-_id', 'code', 'name'])
        .lean<OutProduct[]>();

      const productByCode = new Map<string, OutProduct>(
        productList.map((p) => [p.code, p]),
      );

      productOptionList.forEach((option) => {
        if (!productByCode.has(option.productCode)) {
          productByCode.set(option.productCode, {
            code: option.productCode,
            name: '',
          });
        }
      });

      const result: OutOptionProduct[] = productOptionList.map((option) => {
        const outProduct = productByCode.get(option.productCode);
        const outOption: OutOptionProduct = {
          count: option.count,
          productCode: outProduct,
        };
        return outOption;
      });

      return result;
    });
  }
}
