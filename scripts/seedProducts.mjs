/**
 * One-time bootstrap script to seed the Products collection with the items
 * that used to be hardcoded on the Products page, so the page keeps working
 * immediately after the Products admin module ships.
 *
 * Usage:
 *   node scripts/seedProducts.mjs
 *
 * Safe to re-run:
 * - Skips any name that already has pricing set (never overwrites an
 *   admin's own edits).
 * - If a name already exists but still has no pricing (originalPrice === 0
 *   from before pricing fields existed), backfills just the pricing/stock/
 *   featured fields onto that existing document instead of creating a
 *   duplicate or leaving it half-migrated.
 * Mirrors scripts/seedTeam.mjs.
 *
 * Category/pricing shape is duplicated here (rather than imported from
 * lib/productPricing.js) because this script runs under plain Node ESM,
 * outside Next.js's bundler — the app's `lib/*.js` files aren't loadable
 * that way without a `"type": "module"` change to package.json, which would
 * affect unrelated build tooling (postcss/tailwind configs). seedTeam.mjs
 * took the same approach for the same reason.
 *
 * Sprint 18: this script still writes the 3 legacy category strings
 * ('mobility-aids' | 'educational-products' | 'merchandise') on purpose —
 * `scripts/migrateProductCategories.mjs` (run it after this one on a fresh
 * environment) creates the matching ProductCategory documents and converts
 * every product's `category` field from that string to the new ObjectId
 * ref, regardless of which script created the product.
 */
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local'
});

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

const ProductSchema = new mongoose.Schema(
  {
    name: String,
    description: { type: String, default: '' },
    category: { type: String, enum: ['mobility-aids', 'educational-products', 'merchandise'] },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    originalPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    stockStatus: { type: String, enum: ['in-stock', 'out-of-stock'], default: 'in-stock' },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

function discountFromPrices(originalPrice, sellingPrice) {
  if (originalPrice <= 0 || sellingPrice <= 0 || sellingPrice >= originalPrice) return 0;
  return Math.round((1 - sellingPrice / originalPrice) * 100);
}

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// originalPrice: 0 means "no price set yet" — Community Gift Sets is left
// that way on purpose to exercise the "Pricing coming soon" fallback on the
// public card.
const SEED_PRODUCTS = [
  {
    name: 'High-Contrast Neon Tape',
    description: 'Highly visible safety tape for marking step edges, doorways, and hazard zones — helps older adults with low vision navigate safely at home.',
    category: 'mobility-aids',
    originalPrice: 299,
    sellingPrice: 249,
    displayOrder: 1,
  },
  {
    name: 'Water-Filled Plastic Bottles',
    description: 'Adjustable-weight resistance tools — the simplest, most accessible home exercise equipment there is. No gym required.',
    category: 'mobility-aids',
    originalPrice: 199,
    sellingPrice: 149,
    featured: true,
    displayOrder: 2,
  },
  {
    name: 'Spring-Loaded Grip Squeezer',
    description: 'A handheld grip strengthener for building hand and forearm strength — important for carrying, opening jars, and preventing falls when grabbing railings.',
    category: 'mobility-aids',
    originalPrice: 349,
    sellingPrice: 349,
    displayOrder: 3,
  },
  {
    name: 'Anti-Fatigue Foam Kitchen Mat',
    description: 'A cushioned mat for the kitchen floor to reduce joint pain and fatigue during standing tasks — one of the most impactful comfort purchases for daily life.',
    category: 'mobility-aids',
    originalPrice: 999,
    sellingPrice: 599,
    stockStatus: 'out-of-stock',
    displayOrder: 4,
  },
  {
    name: 'Wheeled Utility Rolling Cart',
    description: 'A practical rolling cart to carry items safely between rooms — reduces strain, avoids awkward lifting, and helps maintain independence at home.',
    category: 'mobility-aids',
    originalPrice: 1999,
    sellingPrice: 1499,
    displayOrder: 5,
  },
  {
    name: 'Printed Daily Protein Tracking Card',
    description: 'A simple, laminated daily card to track protein intake at each meal — designed for adults 50+ who need to protect and rebuild muscle mass. Doctor-designed, easy to use.',
    category: 'educational-products',
    originalPrice: 199,
    sellingPrice: 99,
    featured: true,
    displayOrder: 1,
  },
  {
    name: 'Stronger Steps T-Shirts',
    description: 'Soft, breathable tees in sizes designed for a comfortable fit for older adults.',
    category: 'merchandise',
    originalPrice: 799,
    sellingPrice: 599,
    displayOrder: 1,
  },
  {
    name: 'Walking Gear Bundle',
    description: 'Cap, water bottle, and wristband — everything you need for a confident morning walk.',
    category: 'merchandise',
    originalPrice: 1499,
    sellingPrice: 999,
    displayOrder: 2,
  },
  {
    name: 'Community Gift Sets',
    description: "Ready-to-gift sets for family members who want to encourage a loved one's healthy aging journey.",
    category: 'merchandise',
    originalPrice: 0,
    sellingPrice: 0,
    displayOrder: 3,
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  for (const product of SEED_PRODUCTS) {
    const { originalPrice = 0, sellingPrice = 0, stockStatus = 'in-stock', featured = false } = product;
    const discountPercentage = discountFromPrices(originalPrice, sellingPrice);

    // eslint-disable-next-line no-await-in-loop
    const existing = await Product.findOne({ name: product.name });

    if (!existing) {
      // eslint-disable-next-line no-await-in-loop
      await Product.create({
        ...product,
        originalPrice,
        sellingPrice,
        discountPercentage,
        stockStatus,
        featured,
        status: 'published',
        publishedAt: new Date(),
      });
      console.log(`Created product: ${product.name}`);
      continue; // eslint-disable-line no-continue
    }

    if (!existing.originalPrice && !existing.sellingPrice) {
      existing.originalPrice = originalPrice;
      existing.sellingPrice = sellingPrice;
      existing.discountPercentage = discountPercentage;
      existing.stockStatus = stockStatus;
      existing.featured = featured;
      // eslint-disable-next-line no-await-in-loop
      await existing.save();
      console.log(`Backfilled pricing for existing product: ${product.name}`);
      continue; // eslint-disable-line no-continue
    }

    console.log(`"${product.name}" already has pricing set. Skipping.`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to seed products:', err);
  process.exit(1);
});
