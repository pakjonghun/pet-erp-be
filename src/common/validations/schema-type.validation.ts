import { CanCheckType } from '../types';

export const isValidateType = (value: unknown, type: CanCheckType) => {
  return typeof value === type;
};

export const typeValidator = (type: CanCheckType) => {
  return {
    validator: (value) => isValidateType(value, type),
    message: (props) => `${props.value}는 올바른 데이터 타입이 아닙니다.`,
  };
};

export const patternValidator = (valueType: 'email' | 'phone') => {
  const regexMapper = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^010-?([0-9]{4})-?([0-9]{4})$/,
  };

  return {
    validator: (value) => regexMapper[valueType].test(value),
    message: (props) => `${props.value}는 올바른 형식이 아닙니다.`,
  };
};
