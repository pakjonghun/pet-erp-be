import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async upload(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.xlsx.readFile(file.path);
    const fistSheet = worksheet.getWorksheet(1);
    fistSheet.eachRow((row) => {
      row.eachCell((cell) => {
        const value = cell.value;
        // const $col$row = cell.$col$row;
        console.log(typeof value, value);
      });
    });
  }
}
