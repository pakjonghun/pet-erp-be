import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import mongoose from 'mongoose';
import { COMMON_VALIDATE_ERROR } from './constants';

@ValidatorConstraint({ name: 'customTextValidator', async: false })
class IsObjectIdValidator implements ValidatorConstraintInterface {
  validate(id: string) {
    return mongoose.isValidObjectId(id);
  }

  defaultMessage() {
    return COMMON_VALIDATE_ERROR;
  }
}

export function IsObjectId(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'customTextValidation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsObjectIdValidator,
    });
  };
}
