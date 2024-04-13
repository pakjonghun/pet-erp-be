import { BadRequestException, Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';
import { HydratedDocument } from 'mongoose';
import { DATE_FORMAT } from 'src/sale/constants';

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

  yesterday() {
    return dayjs().subtract(1, 'day').startOf('day').format(DATE_FORMAT);
  }

  getRandomNumber(length: number) {
    return Math.floor(Math.random() * Math.pow(10, length));
  }
}
