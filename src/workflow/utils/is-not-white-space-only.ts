import { registerDecorator, ValidationOptions } from 'class-validator';

export function isNotWhiteSpaceOnly(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isNotWhiteSpaceOnly',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value === '') {
            return true;
          }
          if (value === null || value === undefined) {
            return true;
          }
          return typeof value === 'string' && value.trim().length > 0;
        },
      },
    });
  };
}
