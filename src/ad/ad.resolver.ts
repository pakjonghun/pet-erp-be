import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { AdService } from './ad.service';
import { Ad } from './entities/ad.entity';
import { CreateAdInput } from './dto/create-ad.input';
import { UpdateAdInput } from './dto/update-ad.input';
import { AdsInput } from './dto/ads.input';
import { AdsOutput, AdsOutPutItem } from './dto/ads.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import DataLoader from 'dataloader';
import { InternalServerErrorException } from '@nestjs/common';
import { ProductCodeName } from 'src/client/dtos/clients.output';

@Resolver(() => AdsOutPutItem)
export class FactoryResolver {
  constructor(private readonly adService: AdService) {}

  @LogData({ description: '광고생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => AdsOutPutItem)
  createAd(@Args('createAdInput') createAdInput: CreateAdInput) {
    return this.adService.create(createAdInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => AdsOutput, { name: 'ads' })
  async ads(@Args('adsInput') adsInput: AdsInput) {
    const result = await this.adService.findMany(adsInput);
    return result;
  }

  @LogData({ description: '광고 업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => AdsOutPutItem)
  updateAd(@Args('updateAdInput') updateAdInput: UpdateAdInput) {
    return this.adService.update(updateAdInput);
  }

  @LogData({ description: '광고삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => AdsOutPutItem)
  removeAd(@Args('_id', { type: () => String }) _id: string) {
    return this.adService.remove(_id);
  }

  @ResolveField(() => [String])
  async productCodeList(
    @Parent() ad: Ad,
    @Context('loaders')
    {
      adProductLoader,
    }: { adProductLoader: DataLoader<string, ProductCodeName> },
  ) {
    const productCodeList = ad.productCodeList;
    if (!productCodeList) return [];

    const products = (await adProductLoader.loadMany(
      productCodeList,
    )) as ProductCodeName[];

    if (products.some((item) => item instanceof Error)) {
      throw new InternalServerErrorException(
        '제품 리스트를 검색하는 도중에 오류가 발생했습니다.',
      );
    }

    return products;
  }

  @ResolveField(() => String)
  async clientCode(
    @Parent() ad: Ad,
    @Context('loaders')
    { adClientLoader }: { adClientLoader: DataLoader<string, ProductCodeName> },
  ) {
    const clientCode = ad.clientCode;
    if (!clientCode) return null;

    const client = (await adClientLoader.load(clientCode)) as ProductCodeName;

    return client;
  }
}
