import { Product } from 'src/product/entities/product.entity';
//
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { UtilService } from 'src/util/util.service';
import { ConfigService } from '@nestjs/config';
import { DateRange } from './types';
import { AwsS3Service } from './aws.service';
import { parseStringPromise } from 'xml2js';
import axios from 'axios';
import { SaleRepository } from './sale.repository';
import { Cron } from '@nestjs/schedule';
import { DATE_FORMAT, FULL_DATE_FORMAT } from 'src/common/constants';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Client } from 'src/client/entities/client.entity';
import { Sale, SaleDocument } from './entities/sale.entity';
import { StockService } from 'src/stock/stock.service';
import { DeliveryCost } from './entities/delivery.entity';
import * as https from 'https';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

@Injectable()
export class SabandService {
  private readonly logger = new Logger(SabandService.name);
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Client.name) private readonly clientModel: Model<Client>,
    @InjectModel(DeliveryCost.name)
    private readonly deliveryCostModel: Model<DeliveryCost>,
    private readonly stockService: StockService,
    private readonly configService: ConfigService,
    private readonly utilService: UtilService,
    private readonly awsS3Service: AwsS3Service,
    private readonly saleRepository: SaleRepository,
  ) {}

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

  async out(userId: string) {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const { errors, filteredSaleList } = await this.stockService.saleOut({
        session,
        userId,
      });
      const orderNumberList = filteredSaleList.map((item) => item.orderNumber);
      await this.saleRepository.saleModel.updateMany(
        {
          orderNumber: { $in: orderNumberList },
        },
        {
          $set: {
            isOut: true,
          },
        },
        {
          session,
        },
      );

      await session.commitTransaction();
      this.logger.log(`사방넷 데이터가 모두 저장되었습니다.`);
      return errors;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
  }

  async run() {
    const startDate = dayjs()
      .subtract(10, 'day')
      .startOf('day')
      .format(DATE_FORMAT);
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
    const { saleData, noPayCost } = await this.getSaleData(location);

    await this.awsS3Service.delete(params);

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      await this.saleRepository.bulkUpsert(saleData, session);
      await session.commitTransaction();
      this.logger.log(`사방넷 데이터가 모두 저장되었습니다.`);
      return noPayCost;
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(
        `서버에서 오류가 발생했습니다. ${error.message}`,
      );
    } finally {
      await session.endSession();
    }
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

    const initList = result?.SABANG_ORDER_LIST?.DATA ?? [];
    const newList: any[] = [];

    const allProduct = await this.productModel.find({}).lean<Product[]>();
    const allClient = await this.clientModel.find({}).lean<Client[]>();

    const productByCode = new Map<string, Product>(
      allProduct.map((p) => [p.code, p]),
    );

    const clientByName = new Map<string, Client>(
      allClient.map((c) => [c.name, c]),
    );

    const filterProductCode = {
      ['100006' as string]: 1,
      '100274': 1,
      '100211': 1,
    };

    const filterMallId = {
      // ['로켓그로스' as string]: 1,
      // 정글북: 1,
      라이펫: 1,
      '에스제이크리웍스(한국반려동물아카데미)': 1,
    };

    const changeMallId = {
      ['강아지대통령/고양이대통령' as string]: '펀앤씨',
      포동_일반결제: '포동',
      포동_포인트결제: '포동',
      AliExpress: '알리익스프레스',
      '펫그라운드 (견생냥품)': '견생냥품',
    };

    type RawSale = Pick<Sale, 'mallId' | 'productCode' | 'productName'>;

    const list = initList
      .filter((item) => {
        const productName = item['GOODS_KEYWORD']?.[0];
        const productCode = item['PRODUCT_ID']?.[0] as string;
        const mallId = item['MALL_ID']?.[0] as string;
        if (!productCode || !mallId || !productName) return false;

        if (filterProductCode[productCode] || filterMallId[mallId]) {
          return false;
        }

        return true;
      })
      .map((item) => {
        const mallId = item['MALL_ID']?.[0] as string;
        const newMallId = changeMallId[mallId];
        if (newMallId) {
          item['MALL_ID'][0] = newMallId;
        }
        return item;
      });

    const saleRawDataList: RawSale[] = [];

    for (const item of list) {
      const productCode = item['PRODUCT_ID']?.[0] as string;
      const mallId = item['MALL_ID']?.[0] as string;
      const productName = item['GOODS_KEYWORD']?.[0];
      if (!productCode || !mallId || !productName) continue;

      const object = {
        productCode,
        mallId,
        productName,
      };
      saleRawDataList.push(object);
    }

    const saleRawDataByProductCode = new Map<string, RawSale>(
      saleRawDataList.map((s) => [s.productCode, s]),
    );

    const noProductCodeList: string[] = [];
    const productCodeSet = new Set(
      saleRawDataList.map((item) => item.productCode),
    );
    productCodeSet.forEach((p) => {
      if (!productByCode.has(p)) {
        const product = saleRawDataByProductCode.get(p);
        const productWord = `${product.productName}(${product.productCode})`;
        noProductCodeList.push(productWord);
      }
    });

    const noClientCodeList: string[] = [];
    const mallIdSet = new Set(saleRawDataList.map((item) => item.mallId));
    mallIdSet.forEach((mallId) => {
      if (!clientByName.has(mallId)) {
        noClientCodeList.push(mallId);
      }
    });

    let errorMessage = '';

    if (noProductCodeList.length) {
      errorMessage = `백데이터에 없는 제품이 있습니다. 제품목록 ${noProductCodeList.join(', ')}`;
    }

    if (noClientCodeList.length) {
      errorMessage += `백데이터에 없는 거래처가 있습니다. 거래처이름 ${noClientCodeList.join(', ')}`;
    }

    if (noProductCodeList.length || noClientCodeList.length) {
      throw new BadRequestException(errorMessage);
    }

    const noPayCostList: Sale[] = [];
    for (const item of list) {
      const document = this.saleRepository.emptyDocument;
      const deliveryTime = item['DELIVERY_CONFIRM_DATE']?.[0];
      const saleAt = deliveryTime //
        ? dayjs.utc(deliveryTime, FULL_DATE_FORMAT).subtract(9, 'hour').toDate()
        : null;

      const orderConfirmDate = item['ORD_CONFIRM_DATE']?.[0];
      const orderConfirmedAt = orderConfirmDate //
        ? dayjs
            .utc(orderConfirmDate, FULL_DATE_FORMAT)
            .subtract(9, 'hour')
            .toDate()
        : null;

      const mallId = item['MALL_ID']?.[0];
      const realPayCost = item['PAY_COST']?.[0];
      const productCode = item['PRODUCT_ID']?.[0];
      const count = item['P_EA']?.[0];
      let payCost = item['MALL_WON_COST']?.[0];
      const product = productByCode.get(productCode)!;
      const client = clientByName.get(mallId)!;
      // console.log('판매액', realPayCost, '정산액', payCost);

      if (payCost == 0) {
        const feeRate = client.feeRate;
        payCost = Math.floor(realPayCost * (1 - feeRate));
        // if (productCode == '100145') {
        //   console.log(
        //     '정산액이 없을때 정산액 계산',
        //     'feeRate',
        //     feeRate,
        //     '계산된 정산액',
        //     payCost,
        //     '판매액',
        //     realPayCost,
        //   );
        // }
      }

      const wonCost = product.wonPrice * count;
      // console.log(
      //   '원가계산',
      //   '제품원가',
      //   product.wonPrice,
      //   '개수',
      //   count,
      //   '계산금액',
      //   wonCost,
      // );
      document['code'] = item.IDX.join('_');
      document['shoppingMall'] = item.ORDER_ID?.[0];
      document['consignee'] = item['RECEIVE_NAME'][0];
      document['count'] = count;
      document['barCode'] = item.BARCODE?.[0];
      document['address1'] = item.RECEIVE_ADDR?.[0];
      document['postalCode'] = item.RECEIVE_ZIPCODE?.[0];
      document['telephoneNumber1'] = item['RECEIVE_TEL']?.[0];
      document['message'] = item['DELV_MSG1']?.[0];
      // document['productName'] = item['GOODS_KEYWORD']?.[0];
      document['productName'] = product.name;
      document['deliveryName'] = item['DELIVERY_ID']?.[0];
      document['invoiceNumber'] = item.INVOICE_NO?.[0];
      document['originOrderNumber'] = item['copy_idx']?.[0];
      document['orderNumber'] = item.IDX?.[0];
      document['productCode'] = productCode;
      document['payCost'] = payCost;
      document['orderStatus'] = item['ORDER_STATUS']?.[0];
      document['mallId'] = mallId;
      document['wonCost'] = wonCost;
      document['deliveryCost'] = 0;
      document['saleAt'] = saleAt;
      document['orderConfirmedAt'] = orderConfirmedAt;
      document['totalPayment'] = realPayCost;

      newList.push(document);

      if (realPayCost == 0) {
        noPayCostList.push(document);
      }
    }

    //////////
    //택배비 계산

    const orderNumberList = newList.map((item) => item.orderNumber);
    const savedSaleList = await this.saleRepository.findMany(
      {
        orderNumber: { $in: orderNumberList },
        isOut: true,
      },
      ['orderNumber', '-_id', 'productCode', 'mallId'],
    );

    const savedSaleByOrderNumber = new Map<
      string,
      Pick<Sale, 'productCode' | 'orderNumber' | 'mallId'>
    >(savedSaleList.map((sale) => [sale.orderNumber, sale]));

    const deliveryCost = await this.deliveryCostModel
      .findOne()
      .lean<DeliveryCost>();

    // deliveryCost.
    //아직 출고안된 제품은 모두 false
    //거래처에 해당 제품이 유료배송이면 택배비에 평균 택배비 넣기
    //거래처에 해당 제품이 무료배송이면 택배비는 0원
    //해당 제품이 유배 설정이고 거래처에 해당 제품이 무료배송으로 안들어가 있으면 배송비 넣기
    newList.forEach((sale) => {
      const isNotOutSale = !savedSaleByOrderNumber.has(sale.orderNumber);
      if (isNotOutSale) {
        sale.isOut = false;
      }

      const product = productByCode.get(sale.productCode);
      const client = clientByName.get(sale.mallId);
      const freeDeliveryProductCodeList =
        client?.deliveryFreeProductCodeList ?? [];
      const notFreeDeliveryProductCodeList =
        client?.deliveryNotFreeProductCodeList ?? [];
      const isFreeDelivery = freeDeliveryProductCodeList.some(
        (item) => item == sale.productCode,
      );
      const isNotFreeDelivery = notFreeDeliveryProductCodeList.some(
        (item) => item == sale.productCode,
      );
      const isProductNotFree = !product?.isFreeDeliveryFee;

      if (isFreeDelivery) {
        sale.deliveryCost = 0;
      }

      if (isNotFreeDelivery || (isProductNotFree && !isFreeDelivery)) {
        sale.deliveryCost = deliveryCost.deliveryCost ?? 0;
      }
    });

    /////////

    return {
      saleData: newList as SaleDocument[],
      noPayCost: noPayCostList,
    };
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
