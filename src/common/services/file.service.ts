import { BadRequestException, Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { promisify } from 'util';
import * as fs from 'fs';
import { ProductService } from 'src/product/product.service';

@Injectable()
export class FileService {
  constructor(private readonly productService: ProductService) {}

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

    await this.unlinkExcelFile(file.path);
  }

  async unlinkExcelFile(filePath: string) {
    const unLinkAsync = promisify(fs.unlink);
    await unLinkAsync(filePath);
  }

  async emptyFolder(folderPath: string) {
    const readdirAsync = promisify(fs.readdir);
    const unlinkAsync = promisify(fs.unlink);

    const files = await readdirAsync(folderPath);
    await Promise.all(
      files.map((file) => {
        const filePath = `/${folderPath}/${file}`;
        return unlinkAsync(filePath);
      }),
    );
  }
}
