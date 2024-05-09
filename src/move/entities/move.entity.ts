import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Factory } from 'src/factory/entities/factory.entity';
import { Product } from 'src/product/entities/product.entity';
import { Storage } from 'src/storage/entities/storage.entity';

interface MoveProductInterface {
  count: number;
  product: Product;
}

interface MoveInterface {
  fromStorage?: Storage;
  toStorage?: Storage;
  fromFactory?: Factory;
  toFactory?: Factory;
  products: MoveProductInterface[];
  startDate: Date;
  endDate?: Date;
}

@ObjectType()
export class MoveProduct implements MoveProductInterface {
  @Field(() => Int)
  count: number;

  @Field(() => Product)
  product: Product;
}

@Schema({ versionKey: false, timestamps: { createdAt: false } })
@ObjectType()
export class Move extends AbstractEntity implements MoveInterface {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Storage.name,
  })
  @Field(() => Storage, { nullable: true })
  fromStorage?: Storage;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Storage.name,
  })
  @Field(() => Storage, { nullable: true })
  toStorage?: Storage;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Factory.name,
  })
  @Field(() => Factory, { nullable: true })
  fromFactory?: Factory;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Factory.name,
  })
  @Field(() => Factory, { nullable: true })
  toFactory?: Factory;

  @Prop({ type: mongoose.Schema.Types.ObjectId, name: Product.name })
  @Field(() => [MoveProduct])
  products: MoveProduct[];

  @Prop({ type: Date })
  @Field(() => Date)
  startDate: Date;

  @Prop({ type: Date })
  @Field(() => Date, { nullable: true })
  endDate?: Date;
}
