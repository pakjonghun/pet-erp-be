import { BadRequestException, Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { ProductService } from 'src/product/product.service';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { ClientService } from 'src/client/client.service';

@Injectable()
export class FileService {
  constructor(
    private readonly productService: ProductService,
    private readonly clientService: ClientService,
  ) {}

  async upload(file: Express.Multer.File, service: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.xlsx.readFile(file.path);
    const fistSheet = worksheet.getWorksheet(1);
    switch (service) {
      case 'product':
        await this.productService.upload(fistSheet);
        break;

      case 'client':
        console.log('client');
        await this.clientService.upload(fistSheet);
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
