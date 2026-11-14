import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import * as fs from 'fs';
import { extname, join } from 'path';

export interface UploadedImageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class R2StorageService {
  private readonly logger = new Logger(R2StorageService.name);

  private getConfig() {
    const accountId = process.env.R2_ACCOUNT_ID?.trim();
    const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
    const bucketName = process.env.R2_BUCKET_NAME?.trim();
    const publicUrl = process.env.R2_PUBLIC_URL?.trim();

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName ||
      !publicUrl
    ) {
      return null;
    }

    return {
      accountId,
      accessKeyId,
      secretAccessKey,
      bucketName,
      publicUrl: publicUrl.replace(/\/+$/, ''),
    };
  }

  private sha256Hex(data: Buffer | string): string {
    return createHash('sha256').update(data).digest('hex');
  }

  private hmac(key: Buffer | string, data: string): Buffer {
    return createHmac('sha256', key).update(data).digest();
  }

  /**
   * Sube el escudo de un equipo a Cloudflare R2 (o a disco local si R2 no está configurado).
   * Retorna la URL pública o ruta relativa lista para guardarse en `team.logoUrl`.
   */
  public async uploadTeamLogo(file: UploadedImageFile): Promise<string> {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = (extname(file.originalname) || '.png').toLowerCase();
    const filename = `team-${uniqueSuffix}${ext}`;
    const config = this.getConfig();

    if (!config) {
      this.logger.warn(
        'Variables R2_* no configuradas; guardando escudo localmente en uploads/teams.',
      );
      const destDir = join(process.cwd(), 'uploads', 'teams');
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.writeFileSync(join(destDir, filename), file.buffer);
      return `/uploads/teams/${filename}`;
    }

    const key = `teams/${filename}`;
    const host = `${config.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${config.bucketName}/${key}`;
    const contentType = file.mimetype || 'image/png';
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = this.sha256Hex(file.buffer);

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`;

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      this.sha256Hex(canonicalRequest),
    ].join('\n');

    const kDate = this.hmac(`AWS4${config.secretAccessKey}`, dateStamp);
    const kRegion = this.hmac(kDate, 'auto');
    const kService = this.hmac(kRegion, 's3');
    const kSigning = this.hmac(kService, 'aws4_request');
    const signature = createHmac('sha256', kSigning)
      .update(stringToSign)
      .digest('hex');

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`https://${host}${canonicalUri}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        Authorization: authorization,
      },
      body: new Uint8Array(file.buffer),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(
        `Error subiendo escudo a Cloudflare R2 (${response.status}): ${errorBody}`,
      );
      throw new InternalServerErrorException(
        'No se pudo subir el escudo del equipo a Cloudflare R2.',
      );
    }

    return `${config.publicUrl}/${key}`;
  }
}

