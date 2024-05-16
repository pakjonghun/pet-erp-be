import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { WholeSaleRepository } from './whole-sale.repository';
import { SaleInterface } from 'src/sale/entities/sale.entity';
import * as uuid from 'uuid';
import { InjectModel } from '@nestjs/mongoose';
import { Storage } from 'src/storage/entities/storage.entity';
import { Model } from 'mongoose';

@Injectable()
export class WholeSaleService {
  constructor(
    private readonly wholeSaleRepository: WholeSaleRepository,
    @InjectModel(Storage.name) private readonly storageModel: Model<Storage>,
  ) {}

  async create({ productList, ...commonSaleInfo }: CreateWholeSaleInput) {
    return 'This action adds a new wholeSale';
  }

  findAll() {
    return `This action returns all wholeSale`;
  }

  findOne(id: string) {
    return `This action returns a #${id} wholeSale`;
  }

  update(updateWholeSaleInput: UpdateWholeSaleInput) {
    return `This action updates a  wholeSale`;
  }

  remove(id: number) {
    return `This action removes a #${id} wholeSale`;
  }
}
