import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractEntity } from 'src/common/database/abstract.entity';

export enum LogTypeEnum {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  UPLOAD = 'UPLOAD',
  DELETE = 'DELETE',
}

export interface LogInterface {
  logType: LogTypeEnum;
  userId: string;
  description: string;
}

registerEnumType(LogTypeEnum, { name: 'LogType' });

@Schema({ versionKey: false, timestamps: true })
@ObjectType()
export class Log extends AbstractEntity implements LogInterface {
  @Prop({ type: String })
  @Field(() => String)
  userId: string;

  @Prop({ type: String })
  @Field(() => String)
  description: string;

  @Prop({ type: String, enum: LogTypeEnum })
  @Field(() => LogTypeEnum)
  logType: LogTypeEnum;
}

export const LogSchema = SchemaFactory.createForClass(Log);
