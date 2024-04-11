import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AbstractEntity } from './abstract.entity';
import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';

@Injectable()
export abstract class AbstractRepository<T extends AbstractEntity> {
  protected abstract readonly logger: Logger;

  constructor(protected readonly model: Model<T>) {}

  async create(body: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const newDocument = new this.model({
      ...body,
      _id: new Types.ObjectId(),
    });

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
    if (!result) {
      this.logger.warn(`find one failed ${query}`);
      throw new NotFoundException('검색된 문서가 없습니다.');
    }

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
}
