import { FilterQuery } from 'mongoose';
import { FindManyDTO } from '../dtos/find-many.input';

export type FindManyInput<T> = Omit<FindManyDTO, 'keyword'> & {
  filterQuery: FilterQuery<T>;
};
