import { Injectable } from '@nestjs/common';
import { CreateWholesaleSupplierInput } from './dto/create-wholesale-supplier.input';
import { UpdateWholesaleSupplierInput } from './dto/update-wholesale-supplier.input';

@Injectable()
export class WholesaleSupplierService {
  create(createWholesaleSupplierInput: CreateWholesaleSupplierInput) {
    return 'This action adds a new wholesaleSupplier';
  }

  findAll() {
    return `This action returns all wholesaleSupplier`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wholesaleSupplier`;
  }

  update(id: number, updateWholesaleSupplierInput: UpdateWholesaleSupplierInput) {
    return `This action updates a #${id} wholesaleSupplier`;
  }

  remove(id: number) {
    return `This action removes a #${id} wholesaleSupplier`;
  }
}
