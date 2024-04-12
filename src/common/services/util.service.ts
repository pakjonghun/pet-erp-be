import { BadRequestException, Injectable } from '@nestjs/common';
import { HydratedDocument } from 'mongoose';

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
}
