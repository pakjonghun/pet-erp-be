import { CanCheckType } from '../types';

export const isValidateType = (value: unknown, type: CanCheckType) => {
  return typeof value === type;
};

export const validator = (type: CanCheckType) => {
  return {
    validator: (value) => isValidateType(value, type),
    message: (props) => `${props.value}는 올바른 데이터 타입이 아닙니다.`,
  };
};
