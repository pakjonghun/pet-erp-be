import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import mongoose, { Model } from 'mongoose';
import * as DataLoader from 'dataloader';

@Injectable()
export class ProductLoader {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  createLoader(): DataLoader<string, Product> {
    return new DataLoader(async (productIds) => {
      const products = await this.productModel.find({
        _id: {
          $in: productIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      });

      const productMap = new Map<string, Product>();

      products.forEach((product) => {
        const productId = product._id.toHexString();
        if (!productMap.has(productId)) {
          productMap.set(productId, product);
        }
      });

      return productIds.map((id) => productMap.get(id));
    });
  }
}
