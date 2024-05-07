import { forwardRef } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Product } from 'src/product/entities/product.entity';
import { Stock } from 'src/stock/entities/stock.entity';
import { Subsidiary } from 'src/subsidiary/entities/subsidiary.entity';
// 아이디	재고 아이디	출고장소아이디	입고장소아이디	물건 아이디(제품, 부자재)	카테고리(제품, 부자재)	수량	이동시작날짜	이동종료날짜	상태
interface MoveInterface {
  fromStock: Stock;
  toStock: Stock;
  product: Product;
  subsidiary: Subsidiary;
  count: number;
  fromDate: Date;
  toDate: Date;
}

@Schema({ versionKey: false, timestamps: { createdAt: false } })
@ObjectType()
export class Move extends AbstractEntity implements MoveInterface {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Stock.name,
  })
  @Field(() => Stock)
  fromStock: Stock;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    name: Stock.name,
  })
  @Field(() => Stock)
  toStock: Stock;

  @Prop({ type: mongoose.Schema.Types.ObjectId, name: Product.name })
  @Field(() => Product)
  product: Product;

  @Prop({ type: mongoose.Schema.Types.ObjectId, name: Subsidiary.name })
  @Field(() => Subsidiary)
  subsidiary: Subsidiary;

  @Prop({ type: Number })
  @Field(() => Int)
  count: number;

  @Prop({ type: Date })
  @Field(() => Date)
  fromDate: Date;

  @Prop({ type: Date })
  @Field(() => Date)
  toDate: Date;
}
