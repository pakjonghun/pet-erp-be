import { Injectable } from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';
import { WholeSaleRepository } from './whole-sale.repository';
import { SaleInterface } from 'src/sale/entities/sale.entity';
import * as uuid from 'uuid';

@Injectable()
export class WholeSaleService {
  constructor(private readonly wholeSaleRepository: WholeSaleRepository) {}

  async create({
    productList,
    storage,
    ...commonSaleInfo
  }: CreateWholeSaleInput) {
    const allWholeSaleData = productList.map((product) => {
      // const uniqueId = uuid.v4();
      // const code = `${uniqueId}_${product.productCode}_${storage._id}`;
      // const saleData: SaleInterface = { ...product, code, ...commonSaleInfo };
      // const saleDateDoc = new this.wholeSaleRepository.model(saleData);
      // return saleDateDoc;
    });

    // await this.wholeSaleRepository.bulkWrite(allWholeSaleData);
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
