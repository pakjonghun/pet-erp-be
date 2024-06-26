import { FileService } from './common/services/file.service';
import {
  Controller,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ExcelFileSizeValidator,
  ExcelFileTypeValidator,
} from './common/validations/file.validation';
import {
  ALLOW_EXCEL_FILE_TYPE_LIST,
  EXCEL_FILE_SIZE_LIMIT,
} from './common/constants';
import { diskStorage } from 'multer';
import { Roles } from './common/decorators/role.decorator';
import { AuthRoleEnum } from './users/entities/user.entity';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Roles([AuthRoleEnum.ANY])
  @Post('/upload/:service')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './upload',
        filename(req, file, callback) {
          const suffix = `${Date.now()}_${Math.round(Math.random() * 1000)}`;
          callback(null, suffix);
        },
      }),
    }),
  )
  async upload(
    @Param('service') service: string,
    @UploadedFile(
      new ParseFilePipe({
        errorHttpStatusCode: 400,
        validators: [
          new ExcelFileSizeValidator({ size: EXCEL_FILE_SIZE_LIMIT }),
          new ExcelFileTypeValidator({ allowType: ALLOW_EXCEL_FILE_TYPE_LIST }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.fileService.upload(file, service);
  }

  @Roles([AuthRoleEnum.ANY])
  @Post('/download/:service')
  async download(@Param('service') service: string) {
    return this.fileService.download(service);
  }
}
