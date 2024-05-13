import { ConflictException, Injectable } from '@nestjs/common';
import { CreateFactoryInput } from './dto/create-factory.input';
import { UpdateFactoryInput } from './dto/update-factory.input';
import { FactoryRepository } from './factory.repository';
import { InjectModel } from '@nestjs/mongoose';
import { ProductOrder } from 'src/product-order/entities/product-order.entity';
import { Model } from 'mongoose';

@Injectable()
export class FactoryService {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    @InjectModel(ProductOrder.name)
    private readonly productOrderModel: Model<ProductOrder>,
  ) {}

  async create(createFactoryInput: CreateFactoryInput) {
    await this.beforeCreateOrUpdate(createFactoryInput.name);
    return this.factoryRepository.create(createFactoryInput);
  }

  findAll(factoryName: string) {
    return this.factoryRepository.findAll({
      name: { $regex: factoryName, $options: 'i' },
    });
  }

  async update({ _id, ...body }: UpdateFactoryInput) {
    if (body.name) {
      await this.beforeCreateOrUpdate(body.name);
    }

    return this.factoryRepository.update({ _id }, body);
  }

  async remove(_id: string) {
    const isFactoryUsedInOrder = await this.productOrderModel.exists({
      factory: { _id },
    });
    if (isFactoryUsedInOrder) {
      throw new ConflictException(
        `${_id} 해당 공장은 발주기록이 존재하므로 삭제할 수 없습니다.`,
      );
    }

    return this.factoryRepository.remove({ _id });
  }

  private beforeCreateOrUpdate(name: string) {
    const isNameExist = this.factoryRepository.exists({
      name,
    });
    if (isNameExist) {
      throw new ConflictException(`${name}은 이미 사용중인 공장 이름 입니다.`);
    }
  }
}
