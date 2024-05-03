import { Test, TestingModule } from '@nestjs/testing';
import { WholesaleSupplierResolver } from './wholesale-supplier.resolver';
import { WholesaleSupplierService } from './wholesale-supplier.service';

describe('WholesaleSupplierResolver', () => {
  let resolver: WholesaleSupplierResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WholesaleSupplierResolver, WholesaleSupplierService],
    }).compile();

    resolver = module.get<WholesaleSupplierResolver>(WholesaleSupplierResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
