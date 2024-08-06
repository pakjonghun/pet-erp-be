import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { CreateOptionInput } from './dto/create-option.input';
import { UpdateOptionInput } from './dto/update-option.input';
import { OptionRepository } from './option.repository';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { UtilService } from 'src/util/util.service';
import { Option } from './entities/option.entity';
import { OptionsInput } from './dto/options.input';
import { Product } from 'src/product/entities/product.entity';
import { OutProduct } from './dto/options.output';

@Injectable()
export class OptionService {
  constructor(
    private readonly optionRepository: OptionRepository,
    private readonly utilService: UtilService,
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>,
  ) {}

  async create(createOptionInput: CreateOptionInput) {
    await this.idDuplicateCheck(createOptionInput.id);
    await this.productCodeExistCheck(
      createOptionInput.productOptionList.map((p) => p.productCode),
    );
    return this.optionRepository.create(createOptionInput);
  }

  async update({ id, ...body }: UpdateOptionInput) {
    if (body.productOptionList.length > 0) {
      await this.productCodeExistCheck(
        body.productOptionList.map((p) => p.productCode),
      );
    }

    return this.optionRepository.update({ id }, body);
  }

  async findMany({ keyword, skip, limit, sort, order }: OptionsInput) {
    const filterQuery: FilterQuery<Option> = {
      $or: [
        {
          name: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
        {
          id: {
            $regex: this.utilService.escapeRegex(keyword),
            $options: 'i',
          },
        },
      ],
    };

    return this.optionRepository.findMany({
      filterQuery,
      skip,
      limit,
      order,
      sort,
    });
  }

  async remove(id: string) {
    const isExist = await this.optionRepository.exists({ id });
    if (!isExist) {
      throw new ConflictException('해당 옵션을 찾을 수 없습니다.');
    }

    const result = await this.optionRepository.remove({ id });
    return result;
  }

  private async idDuplicateCheck(optionId: string) {
    const isExist = await this.optionRepository.exists({ id: optionId });
    if (isExist) {
      throw new BadRequestException(
        `${optionId}는 이미 사용중인 옵션 아이디 입니다.`,
      );
    }
  }

  private async productCodeExistCheck(productCodeList: string[]) {
    const productList = await this.productModel
      .find({ code: { $in: productCodeList } })
      .select(['-_id', 'code', 'name'])
      .lean<OutProduct[]>();

    const productByCode = new Map<string, OutProduct>(
      productList.map((p) => [p.code, p]),
    );

    for (const p of productCodeList) {
      if (!productByCode.has(p)) {
        throw new BadRequestException(`${p}코드의 제품을 찾을 수 없습니다.`);
      }
    }
  }
}
