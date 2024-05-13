import { Product } from './../product/entities/product.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateStockInput } from './dto/create-stock.input';
import { UpdateStockInput } from './dto/update-stock.input';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Subsidiary } from 'src/subsidiary/entities/subsidiary.entity';
import { Storage } from 'src/storage/entities/storage.entity';
import { Stock, StockDocument, StockInterface } from './entities/stock.entity';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
    @InjectModel(Subsidiary.name)
    private readonly subsidiaryModel: Model<Subsidiary>,
    private readonly stockRepository: StockRepository,
  ) {}

  async add({ stocks }: CreateStockInput) {
    for await (const { productId, storageId, count, isSubsidiary } of stocks) {
      const product = await this.productModel.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException(
          `${productId}는 존재하지 않는 제품 아이디 입니다.`,
        );
      }

      const storage = await this.storageModel.findOne({ _id: storageId });
      if (!storage) {
        throw new NotFoundException(
          `${storageId}는 존재하지 않는 창고 아이디 입니다.`,
        );
      }

      const stock = await this.findOne({
        storage,
        product,
      });

      if (!stock) {
        await this.stockRepository.create({
          count,
          isSubsidiary,
          product,
          storage,
        });
      } else {
        await this.stockRepository.update(
          { _id: stock._id },
          {
            count: stock.count + count,
          },
        );
      }
    }
  }

  async out({ stocks }: CreateStockInput) {
    const newStock: StockDocument[] = [];

    for await (const { productId, storageId, count, isSubsidiary } of stocks) {
      const product = await this.productModel.findOne({ _id: productId });
      if (!product) {
        throw new NotFoundException(
          `${productId}는 존재하지 않는 제품 아이디 입니다.`,
        );
      }

      const storage = await this.storageModel.findOne({ _id: storageId });
      if (!storage) {
        throw new NotFoundException(
          `${storageId}는 존재하지 않는 창고 아이디 입니다.`,
        );
      }

      const stock = await this.findOne({
        storage,
        product,
      });

      if (!stock) {
        throw new ConflictException(
          `${storage.name}창고에 ${product.name} 제품이 존재하지 않습니다.`,
        );
      }

      if (stock.count < count) {
        throw new ConflictException(
          `재고가 부족합니다. ${storage.name}창고에 ${product.name} 제품은 ${stock.count}EA 남아있습니다.`,
        );
      }

      const stockDoc = new this.stockRepository.model({
        count,
        isSubsidiary,
        product,
        storage,
      });

      newStock.push(stockDoc);
    }

    return this.stockRepository.bulkWrite(newStock);
  }

  findAll() {
    return `This action returns all stock`;
  }

  findOne(filterQuery: FilterQuery<Stock>) {
    return this.stockRepository.findOne(filterQuery);
  }

  update(id: number, updateStockInput: UpdateStockInput) {
    return `This action updates a #${id} stock`;
  }

  remove(id: number) {
    return `This action removes a #${id} stock`;
  }
}
