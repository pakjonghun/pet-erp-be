import * as ExcelJS from 'exceljs';
import { HydratedDocument } from 'mongoose';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';

@Injectable()
export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {}

  getDocument(body?: Omit<T, '_id' | 'createdAt' | 'updatedAt'>) {
    return body ? new this.model(body) : new this.model();
  }

  async create(body: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const newDocument = this.getDocument(body);

    const result = (await newDocument.save()).toJSON() as unknown as T;
    return result;
  }

  async findAll(query: FilterQuery<T>): Promise<T[]> {
    const result = await this.model
      .find(query)
      .sort({ createdAt: -1 })
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

  async update(query: FilterQuery<T>, body: UpdateQuery<T>): Promise<T> {
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

  async remove(query: FilterQuery<T>): Promise<T> {
    const result = await this.model.findOneAndDelete(query).lean<T>();
    if (!result) {
      this.logger.warn(`delete failed ${query}`);
      throw new BadRequestException('삭제할 문서를 찾지 못했습니다.');
    }

    return result;
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
    colToField: Record<number, Partial<keyof T>>,
    requiredCount: number,
  ) {
    const documents: HydratedDocument<T>[] = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      const document = this.getDocument();
      if (row.actualCellCount < requiredCount) {
        throw new BadRequestException(
          `${rowIndex}번째 줄에 데이터가 모두 입력되어 있지 않습니다. 필수 데이터를 입력해주세요.`,
        );
      }
      row.eachCell((cell, index) => {
        const fieldName = colToField[index] as string;
        if (fieldName) {
          const value =
            typeof cell.value == 'string' //
              ? cell.value.trim().replace(/[\b]/g, '')
              : cell.value;
          document[fieldName] = value;

          const isValid = document.$isValid(fieldName);
          if (!isValid) {
            throw new BadRequestException(
              `${cell.$col$row}에 입력된 ${cell.value ?? '입력안됨'}는 잘못된 값입니다.`,
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

  async checkUnique(documents: HydratedDocument<T>[], fieldName: string) {
    const fieldList = documents.map((d) => d[fieldName]);
    const duplicatedItem = await this.findOne({
      code: { $in: fieldList },
    });
    if (duplicatedItem) {
      throw new BadRequestException(
        `${fieldName}로 입력된 ${duplicatedItem[fieldName]}는 이미 저장된 데이터 입니다.`,
      );
    }
  }
}
