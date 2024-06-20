import { Product } from 'src/product/entities/product.entity';
//
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UtilService } from 'src/util/util.service';
import { ConfigService } from '@nestjs/config';
import { DateRange } from './types';
import { AwsS3Service } from './aws.service';
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { SaleRepository } from './sale.repository';
import { Cron } from '@nestjs/schedule';
import { DATE_FORMAT, FULL_DATE_FORMAT } from 'src/common/constants';

import * as https from 'https';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';

@Injectable()
export class SabandService {
  private readonly logger = new Logger(SabandService.name);
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly awsS3Service: AwsS3Service,
    private readonly saleRepository: SaleRepository,
  ) {
    // this.run();
  }

  @Cron('0 0 7 * * *')
  async runMorningSale() {
    await this.run();
  }

  @Cron('0 0 12 * * *')
  async runAfternoonSale() {
    await this.run();
  }

  @Cron('0 0 19 * * *')
  async runEveningSale() {
    await this.run();
  }

  async run() {
    const startDate = dayjs().subtract(3, 'week').format(DATE_FORMAT);
    const endDate = dayjs().endOf('day').format(DATE_FORMAT);

    const xmlBuffer = await this.createXmlBuffer({ startDate, endDate });
    const params = {
      Bucket: this.configService.get('AWS_BUCKET'),
      Key: `raw/${this.utilService.getRandomNumber(6)}.xml`,
      Body: xmlBuffer,
    };

    this.logger.log(`${startDate} 부터 사방넷 데이터를 불러옵니다.`);

    const result = await this.awsS3Service.upload(params);
    const location = result.Location;
    const saleData = await this.getSaleData(location);
    await this.saleRepository.bulkUpsert(saleData);
    await this.awsS3Service.delete(params);
    this.logger.log(`사방넷 데이터가 모두 저장되었습니다.`);
  }

  private async getSaleData(xmlLocation: string) {
    const httpsAgent = {
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    };
    const res = await axios.get(this.configService.get('DELIVERY_URL'), {
      params: {
        xml_url: xmlLocation,
      },
      httpsAgent: new https.Agent(httpsAgent),
    });

    if (res.data.length < 100) {
      throw new BadRequestException(res.data);
    }
    const result = await this.xmlToJson(res.data);
    return result;
  }

  private async xmlToJson(xmlData: Record<any, any>) {
    const result = await parseStringPromise(xmlData);

    const list = result?.SABANG_ORDER_LIST?.DATA ?? [];
    const newList: any[] = [];

    for await (const item of list) {
      const document = this.saleRepository.emptyDocument;
      const saleAt = item['DELIVERY_CONFIRM_DATE']?.[0] //
        ? dayjs(item['DELIVERY_CONFIRM_DATE']?.[0], {
            format: FULL_DATE_FORMAT,
          }).toDate()
        : null;

      const orderConfirmedAt = item['ORD_CONFIRM_DATE']?.[0] //
        ? dayjs(item['ORD_CONFIRM_DATE']?.[0], {
            format: FULL_DATE_FORMAT,
          }).toDate()
        : null;

      const mallId = item['MALL_ID']?.[0];
      const payCost = item['PAY_COST']?.[0];
      const productCode = item['PRODUCT_ID']?.[0];
      const count = item['P_EA']?.[0];
      let mallWonCost = item['MALL_WON_COST']?.[0];
      if (!mallWonCost) {
        const product = await this.productModel.findOne({ code: productCode });
        const client = await this.clientModel.findOne({ name: mallId });
        mallWonCost =
          (product?.wonPrice ?? 0) * (count ?? 0) +
          (payCost ?? 0) * (client?.feeRate ?? 0);
      }

      document['code'] = item.IDX.join('_');
      document['shoppingMall'] = item.ORDER_ID?.[0];
      document['consignee'] = item['RECEIVE_NAME'][0];
      document['count'] = count;
      document['barCode'] = item.BARCODE?.[0];
      document['address1'] = item.RECEIVE_ADDR?.[0];
      document['postalCode'] = item.RECEIVE_ZIPCODE?.[0];
      document['telephoneNumber1'] = item['RECEIVE_TEL']?.[0];
      document['message'] = item['DELV_MSG1']?.[0];
      document['productName'] = item['GOODS_KEYWORD']?.[0];
      document['deliveryName'] = item['DELIVERY_ID']?.[0];
      document['invoiceNumber'] = item.INVOICE_NO?.[0];
      document['originOrderNumber'] = item['copy_idx']?.[0];
      document['orderNumber'] = item.IDX?.[0];
      document['productCode'] = productCode;
      document['payCost'] = payCost;
      document['orderStatus'] = item['ORDER_STATUS']?.[0];
      document['mallId'] = mallId;
      document['wonCost'] = mallWonCost;
      document['deliveryCost'] = 0;
      document['saleAt'] = saleAt;
      document['orderConfirmedAt'] = orderConfirmedAt;

      newList.push(document);
    }

    return newList;
  }

  private async createXmlBuffer({ startDate, endDate }: DateRange) {
    const sendDate = dayjs().format(DATE_FORMAT);
    const companyId = this.configService.get('COMPANY_ID');
    const authKey = this.configService.get('SEND_AUTH_KEY');
    const content = `
    <?xml version="1.0" encoding="EUC-KR"?>			
    <SABANG_CS_LIST>		
        <HEADER>		
            <SEND_COMPAYNY_ID>${companyId}</SEND_COMPAYNY_ID>	
            <SEND_AUTH_KEY>${authKey}</SEND_AUTH_KEY>	
            <SEND_DATE>${sendDate}</SEND_DATE>	
        </HEADER>		
        <DATA>
            <LANG>UTF-8</LANG>	
            <ORDER_STATUS>004</ORDER_STATUS>
            <ORD_ST_DATE>${startDate}</ORD_ST_DATE>
            <ORD_ED_DATE>${endDate}</ORD_ED_DATE>
            <ORD_FIELD><![CDATA[IDX|ORDER_ID|P_EA|BARCODE|RECEIVE_NAME|RECEIVE_ADDR|RECEIVE_ZIPCODE|RECEIVE_TEL|DELV_MSG1|GOODS_KEYWORD|DELIVERY_ID|INVOICE_NO|RECEIVE_CEL|copy_idx|IDX|PRODUCT_ID|ORDER_DATE|PAY_COST|ORDER_STATUS|MALL_ID|MALL_WON_COST|ORD_CONFIRM_DATE|DELIVERY_CONFIRM_DATE]]></ORD_FIELD>		
        </DATA>
    </SABANG_CS_LIST>
    `;

    return Buffer.from(content, 'utf-8');
  }
}
