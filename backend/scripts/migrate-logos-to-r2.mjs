import { createHash, createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prismaPkg from '@prisma/client';

const { PrismaClient } = prismaPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let val = line.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.join(backendRoot, '.env'));

const accountId = process.env.R2_ACCOUNT_ID?.trim();
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
const bucketName = process.env.R2_BUCKET_NAME?.trim();
const publicUrl = process.env.R2_PUBLIC_URL?.trim()?.replace(/\/+$/, '');

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
  console.error('Faltan variables R2_* en backend/.env');
  process.exit(1);
}

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

async function uploadToR2(filename, buffer, contentType) {
  const key = `teams/${filename}`;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const canonicalUri = `/${bucketName}/${key}`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256Hex(buffer);

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
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, 'auto');
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning)
    .update(stringToSign)
    .digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${canonicalUri}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      Authorization: authorization,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  return `${publicUrl}/${key}`;
}

async function main() {
  const uploadsDir = path.join(backendRoot, 'uploads', 'teams');
  if (!fs.existsSync(uploadsDir)) {
    console.log('No existe la carpeta backend/uploads/teams.');
    return;
  }

  const files = fs
    .readdirSync(uploadsDir)
    .filter((f) => fs.statSync(path.join(uploadsDir, f)).isFile());

  console.log(`Encontrados ${files.length} archivos en uploads/teams...`);

  const prisma = new PrismaClient();
  let uploadedCount = 0;
  let updatedRows = 0;

  try {
    for (const filename of files) {
      const filePath = path.join(uploadsDir, filename);
      const ext = path.extname(filename).toLowerCase();
      const contentType = MIME_MAP[ext] || 'image/png';
      const buffer = fs.readFileSync(filePath);

      const newUrl = await uploadToR2(filename, buffer, contentType);
      uploadedCount++;

      const result = await prisma.team.updateMany({
        where: {
          OR: [
            { logoUrl: `/uploads/teams/${filename}` },
            { logoUrl: { endsWith: `/${filename}` } },
          ],
        },
        data: {
          logoUrl: newUrl,
        },
      });

      updatedRows += result.count;
      console.log(`✓ ${filename} -> ${newUrl} (equipos actualizados: ${result.count})`);
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n--- Resumen de migración ---');
  console.log(`Archivos subidos a R2: ${uploadedCount}/${files.length}`);
  console.log(`Equipos actualizados en BD: ${updatedRows}`);
}

main().catch((err) => {
  console.error('Error en migración:', err);
  process.exit(1);
});

