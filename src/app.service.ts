import { ProductService } from './product/product.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor(private readonly productService: ProductService) {}

  getHello(): string {
    return 'Good Healthy';
  }
}
