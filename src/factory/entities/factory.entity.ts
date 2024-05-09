import { ObjectType, Field } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

interface FactoryInterface {
  name: string;
  phoneNumber: string;
  address: string;
  note: string;
}

@ObjectType()
export class Factory extends AbstractEntity implements FactoryInterface {
  @Prop({ type: String })
  @Field(() => String)
  name: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  phoneNumber: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  address: string;

  @Prop({ type: String })
  @Field(() => String, { nullable: true })
  note: string;
}
