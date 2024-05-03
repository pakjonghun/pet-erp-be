import { Module } from '@nestjs/common';
import { WholesaleSupplierService } from './wholesale-supplier.service';
import { WholesaleSupplierResolver } from './wholesale-supplier.resolver';

@Module({
  providers: [WholesaleSupplierResolver, WholesaleSupplierService],
})
export class WholesaleSupplierModule {}
