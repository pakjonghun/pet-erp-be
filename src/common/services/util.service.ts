import { BadRequestException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { HydratedDocument } from 'mongoose';
import * as ExcelJS from 'exceljs';
import * as isoweek from 'dayjs/plugin/isoWeek';
import { ColumnOption } from 'src/client/types';
dayjs.extend(isoweek);

@Injectable()
export class UtilService {
  checkDuplicatedField(documents: HydratedDocument<any>, fieldName: string) {
    const fieldList = documents.map((item) => item[fieldName]);
    const isFieldDuplicated = fieldList.length !== new Set(fieldList).size;
    if (isFieldDuplicated)
      throw new BadRequestException(
        `같은 ${fieldName}가 여러번 입력되어 있습니다.`,
      );
  }

  excelToObject(
    worksheet: ExcelJS.Worksheet,
    colToField: Record<number, ColumnOption<any>>,
    requiredCount: number,
  ) {
    const result = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const object = {};
      if (row.actualCellCount < requiredCount) {
        throw new BadRequestException(
          `${rowIndex}번째 줄에 데이터가 모두 입력되어 있지 않습니다. 필수 데이터를 입력해주세요.`,
        );
      }
      row.eachCell((cell, cellIndex) => {
        const fieldName = colToField[cellIndex]?.fieldName as string;
        if (fieldName) {
          let value = cell.value;
          if (typeof value === 'string') {
            value = value.trim().replace(/[\b]/g, '');
          }

          if (colToField[cellIndex]?.transform) {
            value = colToField[cellIndex]?.transform(
              cell.value,
            ) as ExcelJS.CellValue;
          }

          object[fieldName] = value;
        }
      });
      result.push(object);
    });

    return result;
  }

  yesterdayDayjs() {
    return dayjs().subtract(1, 'day').startOf('day');
  }

  thisWeekDayjsRange() {
    return [dayjs().startOf('isoWeek'), dayjs().endOf('isoWeek')];
  }

  lastWeekDayjsRange() {
    const lastWeek = dayjs().subtract(1, 'week');
    return [lastWeek.startOf('isoWeek'), lastWeek.endOf('isoWeek')];
  }

  thisMonthDayjsRange() {
    return [dayjs().startOf('month'), dayjs().endOf('month')];
  }

  todayDayjsRange() {
    return [dayjs().startOf('day'), dayjs().endOf('day')];
  }

  monthDayjsRange() {
    return [
      dayjs().startOf('month').startOf('date'),
      dayjs().endOf('month').endOf('date'),
    ];
  }

  getRandomNumber(length: number) {
    return Math.floor(Math.random() * Math.pow(10, length));
  }

  getStringDate(date: dayjs.Dayjs) {
    return date.format('YYYYMMDDHHmmss');
  }
}
