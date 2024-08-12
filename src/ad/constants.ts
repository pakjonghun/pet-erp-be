import { AdType } from './entities/ad.entity';

export const AdTypeToHangle: Record<AdType, string> = {
  [AdType.CHANNEL_APP_PRODUCT]: '채널제품',
  [AdType.CHANNEL_SPECIAL_PRODUCT]: '제품채널',
  [AdType.CHANNEL_PRODUCT_RATE]: '채널공통광고',
  [AdType.COMPANY_RATE]: '회사공통',
};

export const AdTypeToEng: Record<string, AdType> = {
  ['채널제품' as string]: AdType.CHANNEL_APP_PRODUCT,
  ['제품채널' as string]: AdType.CHANNEL_SPECIAL_PRODUCT,
  ['채널공통광고' as string]: AdType.CHANNEL_PRODUCT_RATE,
  ['회사공통' as string]: AdType.COMPANY_RATE,
};
