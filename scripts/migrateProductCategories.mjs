/**
 * One-time migration for Sprint 18's Product Categories CMS. Before this
 * sprint, `Product.category` was a closed 3-value string enum
 * ('mobility-aids' | 'educational-products' | 'merchandise', formerly
 * lib/productCategories.js — deleted this sprint). This script:
 *
 *   1. Creates a ProductCategory document for each of the 3 legacy values
 *      (skipped if a category with that slug already exists — safe to
 *      re-run).
 *   2. Updates every existing Product document whose `category` field is
 *      still one of the legacy strings, pointing it at the matching new
 *      ProductCategory's _id.
 *
 * Must run once against the real database before/immediately after
 * deploying this sprint's schema change (models/Product.js's `category`
 * field is now `ObjectId ref: 'ProductCategory'`, no longer a string enum).
 *
 * Usage:
 *   node scripts/migrateProductCategories.mjs
 *
 * Schema shape duplicated here (not imported from models/) rather than
 * imported from models/Product.js/models/ProductCategory.js — this script
 * runs under plain Node ESM outside Next's bundler, same reason documented
 * in scripts/seedProducts.mjs. `strict: false` on the legacy Product schema
 * so a plain string `category` can still be read before it's overwritten.
 */
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

const LEGACY_CATEGORIES = [
  { value: 'mobility-aids', name: 'Mobility Aids', slug: 'mobility-aids', displayOrder: 0 },
  { value: 'educational-products', name: 'Educational Products', slug: 'educational-products', displayOrder: 1 },
  { value: 'merchandise', name: 'Merchandise', slug: 'merchandise', displayOrder: 2 },
];

const ProductCategorySchema = new mongoose.Schema(
  { name: String, slug: String, description: String, icon: Object, displayOrder: Number, isActive: Boolean },
  { timestamps: true, strict: false }
);
const ProductCategory =
  mongoose.models.ProductCategory || mongoose.model('ProductCategory', ProductCategorySchema);

const ProductSchema = new mongoose.Schema({ category: mongoose.Schema.Types.Mixed }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const idByLegacyValue = {};

  for (const legacy of LEGACY_CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    let category = await ProductCategory.findOne({ slug: legacy.slug });
    if (!category) {
      // eslint-disable-next-line no-await-in-loop
      category = await ProductCategory.create({
        name: legacy.name,
        slug: legacy.slug,
        description: '',
        icon: { url: '', alt: '' },
        displayOrder: legacy.displayOrder,
        isActive: true,
      });
      console.log(`Created ProductCategory "${legacy.name}" (${category._id})`);
    } else {
      console.log(`ProductCategory "${legacy.name}" already exists (${category._id}) — skipping create`);
    }
    idByLegacyValue[legacy.value] = category._id;
  }

  let migratedCount = 0;
  for (const legacy of LEGACY_CATEGORIES) {
    // eslint-disable-next-line no-await-in-loop
    const result = await Product.updateMany(
      { category: legacy.value },
      { $set: { category: idByLegacyValue[legacy.value] } }
    );
    migratedCount += result.modifiedCount || 0;
    if (result.modifiedCount) {
      console.log(`Migrated ${result.modifiedCount} product(s) from "${legacy.value}" -> ${idByLegacyValue[legacy.value]}`);
    }
  }

  console.log(`Done. Migrated ${migratedCount} product document(s) across ${LEGACY_CATEGORIES.length} categories.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
