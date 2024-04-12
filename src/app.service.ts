import { ProductService } from './product/product.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AppService {
  constructor(private readonly productService: ProductService) {}

  getHello(): string {
    return 'Good Healthy!';
  }

  async upload(file: Express.Multer.File, service: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.xlsx.readFile(file.path);
    const fistSheet = worksheet.getWorksheet(1);
    switch (service) {
      case 'product':
        await this.productService.upload(fistSheet);
        break;

      default:
        throw new BadRequestException(
          `${service}는 올바른 서비스 이름이 아닙니다.`,
        );
    }
  }
}
