import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
  Context,
} from '@nestjs/graphql';
import { OptionService } from './option.service';
import { Option } from './entities/option.entity';
import { CreateOptionInput } from './dto/create-option.input';
import { UpdateOptionInput } from './dto/update-option.input';
import { OptionsInput } from './dto/options.input';
import { OptionsOutput, OutProduct, OutputOption } from './dto/options.output';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthRoleEnum } from 'src/users/entities/user.entity';
import { LogTypeEnum } from 'src/log/entities/log.entity';
import { LogData } from 'src/common/decorators/log.decorator';
import DataLoader from 'dataloader';
import { Product } from 'src/product/entities/product.entity';
import { InternalServerErrorException } from '@nestjs/common';

@Resolver(() => OutputOption)
export class OptionResolver {
  constructor(private readonly optionService: OptionService) {}

  @LogData({ description: '옵션생성', logType: LogTypeEnum.CREATE })
  @Roles([AuthRoleEnum.ANY])
  @Mutation(() => OutputOption)
  createOption(
    @Args('createOptionInput') createOptionInput: CreateOptionInput,
  ) {
    return this.optionService.create(createOptionInput);
  }

  @Roles([AuthRoleEnum.ANY])
  @Query(() => OptionsOutput, { name: 'options' })
  async options(@Args('optionsInput') optionsInput: OptionsInput) {
    const result = await this.optionService.findMany(optionsInput);
    return result;
  }

  @LogData({ description: '옵션 업데이트', logType: LogTypeEnum.UPDATE })
  @Roles([AuthRoleEnum.BACK_EDIT])
  @Mutation(() => OutputOption)
  updateOption(
    @Args('updateOptionInput') updateOptionInput: UpdateOptionInput,
  ) {
    return this.optionService.update(updateOptionInput);
  }

  @LogData({ description: '옵션삭제', logType: LogTypeEnum.DELETE })
  @Roles([AuthRoleEnum.BACK_DELETE])
  @Mutation(() => OutputOption)
  removeOption(@Args('id', { type: () => String }) id: string) {
    return this.optionService.remove(id);
  }

  @ResolveField(() => [String])
  async productList(
    @Parent() option: Option,
    @Context('loaders')
    { optionLoader }: { optionLoader: DataLoader<string, OutProduct> },
  ) {
    const productCodeList = option.productCodeList;
    if (!productCodeList) return [];

    const products = (await optionLoader.loadMany(
      productCodeList,
    )) as Product[];

    if (products.some((item) => item instanceof Error)) {
      throw new InternalServerErrorException(
        '제품 리스트를 검색하는 도중에 오류가 발생했습니다.',
      );
    }

    return products;
  }
}
