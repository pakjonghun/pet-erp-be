import { Test, TestingModule } from '@nestjs/testing';
import { WholesaleSupplierService } from './wholesale-supplier.service';

describe('WholesaleSupplierService', () => {
  let service: WholesaleSupplierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WholesaleSupplierService],
    }).compile();

    service = module.get<WholesaleSupplierService>(WholesaleSupplierService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
