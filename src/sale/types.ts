import { ClientSession } from 'mongoose';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type SaleOut = {
  session: ClientSession;
  stock: any[];
};

export type Range = {
  from: Date;
  to: Date;
};
