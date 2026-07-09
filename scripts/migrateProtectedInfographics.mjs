/**
 * One-time migration for Sprint 12.5's Knowledge Center Lead Verification
 * module. Before this sprint, Infographic `fullImage`/`pdf` files lived
 * under public/uploads/ (directly, statically reachable by anyone who had
 * the URL). This sprint moves them to private-uploads/ (never statically
 * served) so they're only reachable through the OTP-gated
 * app/api/verify/download route. This script physically moves each
 * already-uploaded file and rewrites the matching document's `url` field
 * from a public path to a private storage key (bare filename).
 *
 * Usage:
 *   node scripts/migrateProtectedInfographics.mjs
 *
 * Safe to re-run — only touches documents whose fullImage.url/pdf.url still
 * starts with "/uploads/" (already-migrated or never-uploaded fields are
 * left untouched).
 *
 * Schema/category shape duplicated here rather than imported from
 * models/Infographic.js — this script runs under plain Node ESM outside
 * Next's bundler, same reason documented in scripts/seedProducts.mjs.
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import path from 'path';
import { rename, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

const InfographicSchema = new mongoose.Schema(
  {
    fullImage: { url: String, alt: String },
    pdf: { url: String, filename: String },
  },
  { strict: false }
);

const Infographic = mongoose.models.Infographic || mongoose.model('Infographic', InfographicSchema);

const PUBLIC_ROOT = path.join(process.cwd(), 'public', 'uploads');
const PRIVATE_ROOT = path.join(process.cwd(), 'private-uploads');

async function migrateField(doc, field, publicSubdir, privateSubdir) {
  const value = doc[field]?.url;
  if (!value || !value.startsWith('/uploads/')) return false;

  const filename = path.basename(value);
  const source = path.join(PUBLIC_ROOT, publicSubdir, filename);
  const destDir = path.join(PRIVATE_ROOT, privateSubdir);
  const dest = path.join(destDir, filename);

  if (!existsSync(source)) {
    console.warn(`  Skipping ${field} for ${doc._id}: source file missing at ${source}`);
    return false;
  }

  await mkdir(destDir, { recursive: true });
  await rename(source, dest);
  doc[field].url = filename;
  return true;
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const infographics = await Infographic.find({
    $or: [{ 'fullImage.url': /^\/uploads\// }, { 'pdf.url': /^\/uploads\// }],
  });

  console.log(`Found ${infographics.length} infographic(s) with unmigrated files.`);

  let migratedFiles = 0;
  for (const doc of infographics) {
    // eslint-disable-next-line no-await-in-loop
    const imageMoved = await migrateField(doc, 'fullImage', 'infographics', 'infographics-full');
    // eslint-disable-next-line no-await-in-loop
    const pdfMoved = await migrateField(doc, 'pdf', 'infographics-pdfs', 'infographics-pdfs');

    if (imageMoved || pdfMoved) {
      // eslint-disable-next-line no-await-in-loop
      await doc.save();
      migratedFiles += (imageMoved ? 1 : 0) + (pdfMoved ? 1 : 0);
      console.log(`Migrated ${doc._id}${imageMoved ? ' [image]' : ''}${pdfMoved ? ' [pdf]' : ''}`);
    }
  }

  console.log(`Done. Migrated ${migratedFiles} file(s) across ${infographics.length} document(s).`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
