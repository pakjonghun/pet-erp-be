import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { SaleInterface } from './../../sale/entities/sale.entity';
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateWholeSale implements Omit<SaleInterface, 'code'> {
  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  shoppingMall?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  count?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  consignee?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  address1?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  telephoneNumber1?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  productName?: string;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  productCode?: string;

  @IsOptional()
  @IsString()
  @Field(() => Date, { nullable: true })
  saleAt?: Date;

  @IsOptional()
  @IsString()
  @Field(() => Int, { nullable: true })
  payCost?: number;

  @IsOptional()
  @IsString()
  @Field(() => String, { nullable: true })
  mallId?: string;

  @IsOptional()
  @IsString()
  @Field(() => Int, { nullable: true })
  wonCost?: number;

  @IsOptional()
  @IsString()
  @Field(() => Int, { nullable: true })
  deliveryCost?: number;

  @IsOptional()
  @IsBoolean()
  @Field(() => Boolean, { nullable: true })
  isWholeSale?: boolean;
}

@InputType()
export class CreateWholeSaleInput {
  orders: CreateWholeSale[];
}
