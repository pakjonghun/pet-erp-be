import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UtilService } from 'src/common/services/util.service';
import { DATE_FORMAT } from './constants';
import { ConfigService } from '@nestjs/config';
import { DateRange } from './types';
import { AwsS3Service } from './aws.service';
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { SaleRepository } from './sale.repository';
import { Cron } from '@nestjs/schedule';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';

@Injectable()
export class SaleService {
  private readonly logger = new Logger(SaleService.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly awsS3Service: AwsS3Service,
    private readonly saleRepository: SaleRepository,
  ) {}

  @Cron('0 48 13 * * *')
  async run() {
    const startDate = this.utilService.yesterday();
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

  async getSaleData(xmlLocation: string) {
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

  async xmlToJson(xmlData: Record<any, any>) {
    const result = await parseStringPromise(xmlData);

    const list = result?.SABANG_ORDER_LIST?.DATA ?? [];
    const newList = (list as any[]).map((item) => {
      const document = this.saleRepository.emptyDocument;

      document['code'] = item.IDX.join('_');
      document['shoppingMall'] = item.ORDER_ID?.[0];
      document['consignee'] = item['RECEIVE_NAME'][0];
      document['count'] = item['P_EA']?.[0];
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
      document['productCode'] = item['PRODUCT_ID']?.[0];
      document['saleAt'] = item['ORDER_DATE']?.[0];
      document['payCost'] = item['PAY_COST']?.[0];
      document['orderStatus'] = item['ORDER_STATUS']?.[0];
      document['mallId'] = item['MALL_ID']?.[0];
      document['wonCost'] = item['MALL_WON_COST']?.[0];
      document['deliveryCost'] = 0;

      return document;
    });
    return newList;
  }

  async createXmlBuffer({ startDate, endDate }: DateRange) {
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
            <ORD_ST_DATE>${startDate}</ORD_ST_DATE>
            <ORD_ED_DATE>${endDate}</ORD_ED_DATE>
            <ORD_FIELD><![CDATA[IDX|ORDER_ID|P_EA|BARCODE|RECEIVE_NAME|RECEIVE_ADDR|RECEIVE_ZIPCODE|RECEIVE_TEL|DELV_MSG1|GOODS_KEYWORD|DELIVERY_ID|INVOICE_NO|RECEIVE_CEL|copy_idx|IDX|PRODUCT_ID|ORDER_DATE|PAY_COST|ORDER_STATUS|MALL_ID|MALL_WON_COST]]></ORD_FIELD>		
        </DATA>
    </SABANG_CS_LIST>
    `;

    return Buffer.from(content, 'utf-8');
  }
}
