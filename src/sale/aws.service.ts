import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AwsS3Service {
  constructor(private configService: ConfigService) {}

  private client: S3Client;

  get Client() {
    const region = this.configService.get('AWS_REGION');
    const accessKeyId = this.configService.get('AWS_ACCESS_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET');
    if (!this.client) {
      this.client = new S3Client({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    }

    return this.client;
  }

  async upload(params: any) {
    const upload = await new Upload({
      client: this.Client,
      params,
    });
    return await upload.done();
  }

  async delete(params) {
    await this.Client.send(
      new DeleteObjectCommand({
        Bucket: params.Bucket,
        Key: params.Key,
      }),
    );
  }
}
