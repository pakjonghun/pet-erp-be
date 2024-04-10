import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

import { COMMON_VALIDATE_ERROR } from './constants';
import * as dayjs from 'dayjs';

@ValidatorConstraint({ name: 'customTextValidator', async: false })
class DateValidator implements ValidatorConstraintInterface {
  validate(date: unknown) {
    const allowType = ['string', 'number', 'date', 'object'];
    const dateType = typeof date;
    if (allowType.includes(dateType)) {
      return dayjs(date as string | number).isValid();
    } else {
      return false;
    }
  }

  defaultMessage() {
    return COMMON_VALIDATE_ERROR;
  }
}

export function IsDateValidate(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'customDateValidator',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: DateValidator,
    });
  };
}
