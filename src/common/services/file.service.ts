import { BadRequestException, Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { ProductService } from 'src/product/product.service';
import { ClientService } from 'src/client/client.service';
import { ProductCategoryService } from 'src/product-category/product-category.service';
import { SubsidiaryCategoryService } from 'src/subsidiary-category/subsidiary-category.service';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

@Injectable()
export class FileService {
  constructor(
    private readonly subsidiaryCategoryService: SubsidiaryCategoryService,
    private readonly categoryService: ProductCategoryService,
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
        await this.clientService.upload(fistSheet);
        break;

      case 'product-category':
        await this.categoryService.upload(fistSheet);
        break;

      case 'subsidiary-category':
        await this.subsidiaryCategoryService.upload(fistSheet);
        break;

      default:
        throw new BadRequestException(
          `${service}는 올바른 서비스 이름이 아닙니다.`,
        );
    }

    await this.unlinkExcelFile(file.path);
  }

  async download(service: string) {
    switch (service) {
      case 'product':
        return this.productService.downloadExcel();

      case 'client':
        return this.clientService.downloadExcel();

      case 'product-category':
        return this.categoryService.downloadExcel();

      case 'subsidiary-category':
        return this.subsidiaryCategoryService.downloadExcel();

      default:
        throw new BadRequestException(
          `${service}는 올바른 서비스 이름이 아닙니다.`,
        );
    }
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
