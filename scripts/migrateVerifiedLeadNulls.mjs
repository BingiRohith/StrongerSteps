/**
 * One-time migration fixing a pre-existing bug found during Sprint 19.7a
 * verification: `models/VerifiedLead.js`'s `email`/`mobile` fields used to
 * default to explicit `null` rather than being left absent. MongoDB's
 * sparse unique index only excludes documents where the field is entirely
 * *absent* — a document with the field explicitly set to `null` still
 * counts toward the unique constraint, so only ONE VerifiedLead could ever
 * exist with a null email (or null mobile) before hitting an E11000
 * duplicate-key error on the next email-only (or mobile-only) verification.
 *
 * The schema now uses a setter that converts any future `null` assignment
 * to `undefined` (omitting the key entirely) — see models/VerifiedLead.js.
 * This script is the one-time backfill for documents that already have an
 * explicit `email: null` or `mobile: null` from before that fix, so the
 * sparse index is valid going forward without waiting for each affected
 * document to happen to be re-saved.
 *
 * Safe to re-run — only matches documents where the field is present with
 * value `null` (an already-unset/absent field doesn't match `{field: null}`
 * combined with `$exists: true` below, so re-running finds nothing to do).
 *
 * Usage:
 *   node scripts/migrateVerifiedLeadNulls.mjs
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);

  const collection = mongoose.connection.db.collection('verifiedleads');

  const emailResult = await collection.updateMany(
    { email: { $exists: true, $eq: null } },
    { $unset: { email: '' } }
  );
  console.log(`Unset explicit null email on ${emailResult.modifiedCount} lead(s).`);

  const mobileResult = await collection.updateMany(
    { mobile: { $exists: true, $eq: null } },
    { $unset: { mobile: '' } }
  );
  console.log(`Unset explicit null mobile on ${mobileResult.modifiedCount} lead(s).`);

  console.log('Done.');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
