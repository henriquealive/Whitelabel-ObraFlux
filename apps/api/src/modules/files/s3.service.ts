import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.client = new S3Client({
      region: configService.get<string>('aws.region'),
      credentials: {
        accessKeyId: configService.get<string>('aws.accessKeyId')!,
        secretAccessKey: configService.get<string>('aws.secretAccessKey')!,
      },
    });
    this.bucket = configService.get<string>('aws.s3Bucket')!;
  }

  async getPresignedUploadUrl(opts: {
    key?: string;
    contentType: string;
    tenantId: string;
    maxSizeMb?: number;
  }) {
    const key = opts.key ?? `${opts.tenantId}/${uuidv4()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: opts.contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: 900 });
    return { url, key, bucket: this.bucket };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 900) {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getObjectMetadata(key: string) {
    const command = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
    return this.client.send(command);
  }

  async deleteObject(key: string) {
    const command = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
    return this.client.send(command);
  }

  generateKey(tenantId: string, projectId: string | undefined, fileName: string) {
    const folder = projectId ? `${tenantId}/${projectId}` : tenantId;
    return `${folder}/${uuidv4()}-${fileName}`;
  }
}
