import { Injectable } from '@nestjs/common';
import { CreateWholeSaleInput } from './dto/create-whole-sale.input';
import { UpdateWholeSaleInput } from './dto/update-whole-sale.input';

@Injectable()
export class WholeSaleService {
  create(createWholeSaleInput: CreateWholeSaleInput) {
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
