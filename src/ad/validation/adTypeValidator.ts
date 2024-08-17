import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { AdType } from '../entities/ad.entity';

@ValidatorConstraint({ name: 'ChannelOrProductValidator', async: false })
export class ChannelOrProductValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const object = args.object as any;
    const adType = object.type;
    console.log('type : ', adType);
    console.log('value', value);
    console.log('args.property : ', args.property);

    if (!adType) {
      return true; // type이 없으면 다른 유효성 검사에서 걸릴 것임
    }

    const channelNeed =
      adType === AdType.CHANNEL_PRODUCT_RATE ||
      adType === AdType.CHANNEL_APP_PRODUCT ||
      adType === AdType.CHANNEL_SPECIAL_PRODUCT;
    const productNeed =
      adType === AdType.CHANNEL_APP_PRODUCT ||
      adType === AdType.CHANNEL_SPECIAL_PRODUCT;
    if (args.property === 'clientCode' && channelNeed) {
      return value != null && value !== '';
    }

    if (args.property === 'productCodeList' && productNeed) {
      return Array.isArray(value) && value.length > 0;
    }

    return true; // 조건에 해당하지 않는 경우 검사를 통과시킴
  }

  defaultMessage(args: ValidationArguments) {
    if (args.property === 'clientCode') {
      return '해당 광고 타입에서는 clientCode가 필요합니다.';
    }

    if (args.property === 'productCodeList') {
      return '해당 광고 타입에서는 productCodeList가 최소 하나 이상 필요합니다.';
    }

    return '유효하지 않은 값입니다.';
  }
}
