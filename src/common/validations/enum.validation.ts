import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { COMMON_VALIDATE_ERROR } from './constants';

@ValidatorConstraint({ name: 'customTextValidator', async: false })
class IsOneOfValidator implements ValidatorConstraintInterface {
  validate(value: string[], args: ValidationArguments) {
    const [enumType] = args.constraints;
    return Object.values(enumType).includes(value);
  }

  defaultMessage() {
    return COMMON_VALIDATE_ERROR;
  }
}

export function IsOneOf(
  property: object,
  validationOptions?: ValidationOptions,
) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      name: 'customTextValidation',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: IsOneOfValidator,
    });
  };
}
