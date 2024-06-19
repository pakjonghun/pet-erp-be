import * as ExcelJS from 'exceljs';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import {
  FilterQuery,
  Model,
  UpdateQuery,
  HydratedDocument,
  Types,
  ClientSession,
} from 'mongoose';
import { ColumnOption } from 'src/client/types';
import { OrderEnum } from 'src/common/dtos/find-many.input';
import { FindManyInput } from './types';

@Injectable()
export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(public readonly model: Model<T>) {}

  async create(
    body: Omit<T, '_id' | 'createdAt' | 'updatedAt'>,
    session?: ClientSession,
  ): Promise<T> {
    if (session) {
      const newDocument = new this.model({
        _id: new Types.ObjectId(),
        ...body,
      });

      const result = (
        await newDocument.save({ session })
      ).toJSON() as unknown as T;
      return result;
    } else {
      const newDocument = new this.model({
        _id: new Types.ObjectId(),
        ...body,
      });

      const result = (await newDocument.save()).toJSON() as unknown as T;
      return result;
    }
  }

  async findAll(query: FilterQuery<T>): Promise<T[]> {
    const result = await this.model
      .find(query)
      .sort({ createdAt: -1, _id: 1 })
      .lean<T[]>();
    return result;
  }

  async exists(query: FilterQuery<T>) {
    const result = await this.model.exists(query);
    return result;
  }

  async findOne(query: FilterQuery<T>): Promise<T> {
    const result = await this.model.findOne(query).lean<T>();
    return result;
  }

  async update(
    query: FilterQuery<T>,
    body: UpdateQuery<T>,
    session?: ClientSession,
  ): Promise<T> {
    if (session) {
      const result = await this.model
        .findOneAndUpdate(query, body, {
          new: true,
          session,
        })
        .lean<T>();
      if (!result) {
        this.logger.warn(`update failed ${query}`);
        throw new BadRequestException('업데이트할 문서를 찾지 못했습니다.');
      }

      return result;
    } else {
      const result = await this.model
        .findOneAndUpdate(query, body, {
          new: true,
        })
        .lean<T>();
      if (!result) {
        this.logger.warn(`update failed ${query}`);
        throw new BadRequestException('업데이트할 문서를 찾지 못했습니다.');
      }

      return result;
    }
  }

  async remove(query: FilterQuery<T>, session?: ClientSession): Promise<T> {
    if (session) {
      const result = await this.model
        .findOneAndDelete(query, { session })
        .lean<T>();
      if (!result) {
        this.logger.warn(`delete failed ${query}`);
        throw new BadRequestException('삭제할 문서를 찾지 못했습니다.');
      }

      return result;
    } else {
      const result = await this.model.findOneAndDelete(query).lean<T>();
      if (!result) {
        this.logger.warn(`delete failed ${query}`);
        throw new BadRequestException('삭제할 문서를 찾지 못했습니다.');
      }

      return result;
    }
  }

  async bulkWrite(documents: HydratedDocument<T>[]) {
    await this.model.bulkWrite(
      documents.map((document) => {
        return {
          insertOne: { document },
        };
      }),
    );
  }

  async excelToDocuments(
    worksheet: ExcelJS.Worksheet,
    colToField: Record<number, ColumnOption<any>>,
    requiredCount: number,
  ) {
    const documents: HydratedDocument<T>[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const document = new this.model();
      if (row.actualCellCount < requiredCount) {
        throw new BadRequestException(
          `${rowIndex}번째 줄에 데이터가 모두 입력되어 있지 않습니다. 필수 데이터를 입력해주세요.`,
        );
      }
      row.eachCell((cell, index) => {
        const fieldName = colToField[index]?.fieldName as string;
        if (fieldName) {
          let value = cell.value;
          if (typeof value === 'string') {
            value = value.trim().replace(/[\b]/g, '');
          }

          if (colToField[index]?.transform) {
            value = colToField[index]?.transform(
              cell.value,
            ) as ExcelJS.CellValue;
          }

          document[fieldName] = value;
          const isRef = document.schema.path(fieldName)?.options?.ref;
          const isValid = isRef ? true : document.$isValid(fieldName);
          if (!isValid) {
            throw new BadRequestException(
              `${cell.$col$row}에 ${fieldName}으로 입력된 ${cell.value ?? '입력안됨'}는 잘못된 값입니다.`,
            );
          }
        }
      });
      documents.push(document);
    });
    for await (const document of documents) {
      await document.validate();
    }

    return documents;
  }

  async objectToDocuments(objectList: any[]) {
    const documents: HydratedDocument<T>[] = [];

    for await (const object of objectList) {
      const document = new this.model(object);

      await document.validate();
      documents.push(document);
    }
    return documents;
  }

  async docUniqueCheck(documents: HydratedDocument<T>[], fieldName: string) {
    const fieldList = documents.map((d) => d[fieldName]);

    const query: FilterQuery<T> = {
      [fieldName as any]: { $in: fieldList },
    };

    const duplicatedItem = await this.findOne(query);
    if (duplicatedItem) {
      throw new BadRequestException(
        `${fieldName}로 입력된 ${duplicatedItem[fieldName]}는 이미 저장된 데이터 입니다.`,
      );
    }
  }

  async findMany({
    skip,
    limit,
    order = OrderEnum.DESC,
    sort = 'createdAt',
    filterQuery,
  }: FindManyInput<T>) {
    const orderNumber = order === OrderEnum.DESC ? -1 : 1;
    const totalCount = await this.model.countDocuments(filterQuery);
    const data = await this.model
      .find(filterQuery)
      .sort({ [sort]: orderNumber, _id: 1 })
      .skip(skip)
      .limit(limit)
      .lean<T[]>();

    return { totalCount, data };
  }

  async uniqueCheck(filterQuery: FilterQuery<T>) {
    const isExist = await this.exists(filterQuery);
    if (isExist) {
      let errorMessage = '';
      for (const [key, value] of Object.entries(filterQuery)) {
        errorMessage += `${value} 는 이미 사용중인 ${key}입니다.`;
      }

      throw new BadRequestException(errorMessage);
    }
  }
}
