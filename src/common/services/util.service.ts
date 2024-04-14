import { BadRequestException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { HydratedDocument } from 'mongoose';
import * as isoweek from 'dayjs/plugin/isoWeek';
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

  yesterdayDayjs() {
    return dayjs().subtract(1, 'day').startOf('day');
  }

  thisWeekDayjsRange() {
    return [dayjs().startOf('isoWeek'), dayjs().endOf('isoWeek')];
  }

  todayDayjsRange() {
    return [dayjs().startOf('day'), dayjs().endOf('day')];
  }

  monthDayjsRange() {
    return [
      dayjs().startOf('month').startOf('date'),
      dayjs().endOf('month').endOf('date').toDate(),
    ];
  }

  getRandomNumber(length: number) {
    return Math.floor(Math.random() * Math.pow(10, length));
  }
}
