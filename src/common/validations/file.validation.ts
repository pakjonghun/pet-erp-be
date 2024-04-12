import { FileValidator } from '@nestjs/common';

export class ExcelFileSizeValidator extends FileValidator<Record<string, any>> {
  constructor(protected readonly validationOptions) {
    super(validationOptions);
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    if (file.size > this.validationOptions.size) return false;

    return true;
  }

  buildErrorMessage(file: Express.Multer.File): string {
    return `${file.originalname}파일의 용량은 ${this.validationOptions.size}보다 작아야 합니다.`;
  }
}

export class ExcelFileTypeValidator extends FileValidator<Record<string, any>> {
  constructor(protected readonly validationOptions) {
    super(validationOptions);
  }

  isValid(file?: Express.Multer.File): boolean | Promise<boolean> {
    if (!file) return false;
    if (!this.validationOptions.allowType.includes(file.mimetype)) return false;

    return true;
  }

  buildErrorMessage(file: Express.Multer.File): string {
    return `${file.originalname} 잘못된 파일입니다.`;
  }
}
