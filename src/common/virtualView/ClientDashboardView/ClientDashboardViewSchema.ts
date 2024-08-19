import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { CLIENT_DASHBOARD_VIEW } from './constants';
import { Sale } from 'src/sale/entities/sale.entity';

type SaleDashboard = Pick<
  Sale,
  | 'count'
  | 'payCost'
  | 'wonCost'
  | 'productCode'
  | 'deliveryCost'
  | 'totalPayment'
  | 'deliveryBoxCount'
  | 'saleAt'
  | 'productName'
>;

type SaleClientDashboard = Pick<
  Client,
  | '_id'
  | 'code'
  | 'feeRate'
  | 'name'
  | 'clientType'
  | 'businessName'
  | 'businessNumber'
  | 'inActive'
  | 'payDate'
  | 'isSabangService'
>;

type ClientDashboardViewClass = SaleDashboard & SaleClientDashboard;

@Schema({
  collection: CLIENT_DASHBOARD_VIEW,
})
export class ClientDashboardView
  extends Document
  implements ClientDashboardViewClass
{
  // SaleDashboard 필드
  productName: Sale['productName'];
  count: Sale['count'];
  payCost: Sale['payCost'];
  wonCost: Sale['wonCost'];
  productCode: Sale['productCode'];
  deliveryCost: Sale['deliveryCost'];
  totalPayment: Sale['totalPayment'];
  deliveryBoxCount: Sale['deliveryBoxCount'];
  saleAt: Sale['saleAt'];

  // SaleClientDashboard 필드
  _id: Client['_id'];
  code: Client['code'];
  feeRate: Client['feeRate'];
  name: Client['name'];
  clientType: Client['clientType'];
  businessName: Client['businessName'];
  businessNumber: Client['businessNumber'];
  inActive: Client['inActive'];
  payDate: Client['payDate'];
  isSabangService: Client['isSabangService'];
}

export const clientDashboardSchema =
  SchemaFactory.createForClass(ClientDashboardView);

export type ClientDashboardDocument = HydratedDocument<ClientDashboardView>;
