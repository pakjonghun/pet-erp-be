import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Product } from 'src/product/entities/product.entity';
import { AbstractEntity } from 'src/common/database/abstract.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { SubsidiaryCategory } from 'src/subsidiary-category/entities/subsidiary-category.entity';

export interface SubsidiaryInterface {
  code: string;
  name: string;
  productList: Product[];
  category?: SubsidiaryCategory;
  wonPrice?: number;
  leadTime?: number;
}

@ObjectType()
@Schema({ timestamps: { updatedAt: false }, versionKey: false })
export class Subsidiary extends AbstractEntity implements SubsidiaryInterface {
  @Prop({
    type: String,
    unique: true,
    required: [true, '부자재 코드를 입력하세요.'],
  })
  @Field(() => String)
  code: string;

  @Prop({
    type: String,
    unique: true,
    required: [true, '부자재 이름를 입력하세요.'],
  })
  @Field(() => String)
  name: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: SubsidiaryCategory.name,
  })
  @Field(() => SubsidiaryCategory, { nullable: true })
  category: SubsidiaryCategory;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: Product.name }],
  })
  @Field(() => [Product], { nullable: true })
  productList: Product[];

  @Prop({ type: Number, min: [0, '원가는 0 이상의 값을 입력하세요.'] })
  @Field(() => Int, { nullable: true })
  wonPrice?: number;

  @Prop({ type: Number, min: [0, '리드타임은 0 이상의 값을 입력하세요.'] })
  @Field(() => Int, { nullable: true })
  leadTime?: number;
}

export const SubsidiarySchema = SchemaFactory.createForClass(Subsidiary);
