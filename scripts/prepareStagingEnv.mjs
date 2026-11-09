/** Creates a private staging configuration only; never connects to MongoDB or providers. */
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

export function createStagingEnvironment(source, databaseName = 'strongersteps_staging') {
  if (!/^strongersteps_staging(?:_[a-z0-9]+)?$/.test(databaseName)) {
    throw new Error('Use a dedicated strongersteps_staging database name.');
  }
  let uri;
  try { uri = new URL(source.MONGODB_URI); } catch { throw new Error('Source MongoDB URI is missing or invalid.'); }
  if (!['mongodb:', 'mongodb+srv:'].includes(uri.protocol)) throw new Error('Unsupported MongoDB URI.');
  const sourceDatabase = decodeURIComponent(uri.pathname.slice(1)) || 'test';
  if (sourceDatabase === databaseName) throw new Error('Staging database must differ from the source database.');
  // Preserve an explicit authSource. For non-SRV URIs preserve the implicit
  // authentication database too; SRV/Atlas authentication defaults are unchanged.
  if (!uri.searchParams.has('authSource') && uri.protocol === 'mongodb:' && uri.username) {
    uri.searchParams.set('authSource', uri.pathname && uri.pathname !== '/' ? sourceDatabase : 'admin');
  }
  uri.pathname = `/${databaseName}`;
  if (source.RAZORPAY_KEY_ID && !source.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    throw new Error('Refusing to copy non-test Razorpay credentials to staging.');
  }
  return {
    MONGODB_URI: uri.href,
    JWT_SECRET: randomBytes(64).toString('hex'),
    AUTH_COOKIE_NAME: 'ss_staging_token',
    LEAD_COOKIE_NAME: 'ss_staging_lead',
    OTP_EMAIL_PROVIDER: source.RESEND_API_KEY ? 'resend' : 'mock',
    OTP_SMS_PROVIDER: 'mock',
    NOTIFICATION_EMAIL_PROVIDER: 'mock',
    NOTIFICATION_SMS_PROVIDER: 'mock',
    RESEND_API_KEY: source.RESEND_API_KEY || '',
    RESEND_FROM_EMAIL: source.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    RAZORPAY_KEY_ID: source.RAZORPAY_KEY_ID || '',
    RAZORPAY_KEY_SECRET: source.RAZORPAY_KEY_SECRET || '',
    RAZORPAY_WEBHOOK_SECRET: randomBytes(32).toString('hex'),
  };
}

async function main() {
  const source = dotenv.parse(await readFile('.env.local', 'utf8'));
  const settings = createStagingEnvironment(source);
  const content = [
    '# PRIVATE staging configuration. Do not commit or paste into chat.',
    '# Database name is separate; Atlas credentials still come from the local URI.',
    '# Use an Atlas user restricted to this staging database before public deployment.',
    '# No database/content/admin account is created by generating this file.',
    '# Add NEXT_PUBLIC_SITE_URL using the actual Render HTTPS URL before building.',
    '# Set the SAME webhook secret in Razorpay Test Mode after the HTTPS endpoint exists.',
    ...Object.entries(settings).map(([key, value]) => `${key}=${JSON.stringify(value)}`),
    '',
  ].join('\n');
  await writeFile('.env.staging.local', content, { flag: 'wx', mode: 0o600 });
  console.log('Created .env.staging.local; no secrets displayed. Existing files and database unchanged.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.code === 'EEXIST'
      ? 'Staging file already exists; refusing to overwrite it.'
      : 'Could not prepare staging configuration. Check the source URI and test-key mode; no secret values displayed.');
    process.exitCode = 1;
  });
}
