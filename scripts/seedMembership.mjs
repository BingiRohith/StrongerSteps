/**
 * One-time bootstrap script to seed the Membership collection with the
 * plans that used to be hardcoded on /join (Sprint 10's placeholder
 * `MEMBERSHIP_PLANS` array), so the page keeps working immediately after
 * the Membership admin module ships.
 *
 * Usage:
 *   node scripts/seedMembership.mjs
 *
 * Safe to re-run: skips any plan name that already exists, so it never
 * overwrites an admin's own edits or creates a duplicate. Mirrors
 * scripts/seedProducts.mjs / scripts/seedTeam.mjs.
 *
 * Schema is duplicated here (rather than imported from
 * models/Membership.js / lib/membershipOptions.js) because this script runs
 * under plain Node ESM, outside Next.js's bundler — see seedProducts.mjs for
 * why the app's lib/model files aren't loadable that way.
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

const MembershipSchema = new mongoose.Schema(
  {
    name: String,
    shortDescription: String,
    longDescription: { type: String, default: '' },
    price: { type: Number, default: 0 },
    currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
    billingPeriod: {
      type: String,
      enum: ['one-time', 'monthly', 'quarterly', 'yearly', 'free'],
      default: 'monthly',
    },
    discountPercentage: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    featured: { type: Boolean, default: false },
    badgeLabel: { type: String, default: '' },
    theme: { type: String, enum: ['sage', 'accent', 'primary'], default: 'sage' },
    displayOrder: { type: Number, default: 0 },
    ctaLabel: { type: String, default: 'Join Now' },
    ctaUrl: { type: String, default: '' },
    externalUrl: { type: String, default: '' },
    benefits: { type: [String], default: [] },
    image: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

const Membership = mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);

const SEED_PLANS = [
  {
    name: 'Community',
    shortDescription: 'Stay connected and get started with free access to our community and basic resources.',
    price: 0,
    billingPeriod: 'free',
    displayOrder: 1,
    ctaLabel: 'Join for Free',
    ctaUrl: 'https://wa.me/919999999999',
    benefits: [
      'Weekly health tips for adults 50+',
      'Access to the community WhatsApp group',
      'Free monthly newsletter',
      'Invitations to select public events',
    ],
  },
  {
    name: 'Stronger Steps Plus',
    shortDescription: 'Structured support for members who want more than the free community — priority access and real savings.',
    price: 1499,
    billingPeriod: 'monthly',
    discountPercentage: 10,
    featured: true,
    theme: 'accent',
    badgeLabel: 'Most Popular',
    displayOrder: 2,
    ctaLabel: 'Become a Member',
    ctaUrl: 'https://wa.me/919999999999',
    benefits: [
      'Everything in Community',
      'Discounted pricing on workshops & events',
      'Priority booking for limited-seat sessions',
      'Quarterly 1-on-1 check-in call',
      'Access to exclusive member-only content',
    ],
  },
  {
    name: 'Stronger Steps Family',
    shortDescription: "For families supporting a loved one's healthy ageing journey together, at a lower annual rate.",
    price: 14999,
    billingPeriod: 'yearly',
    discountPercentage: 15,
    displayOrder: 3,
    ctaLabel: 'Enquire Now',
    ctaUrl: 'https://wa.me/919999999999',
    benefits: [
      'Everything in Stronger Steps Plus',
      'Covers up to 2 family members',
      'Shared family progress updates',
      'Founding member pricing locked in for renewal',
    ],
  },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  for (const plan of SEED_PLANS) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Membership.findOne({ name: plan.name });

    if (existing) {
      console.log(`"${plan.name}" already exists. Skipping.`);
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    await Membership.create({ ...plan, status: 'active' });
    console.log(`Created membership plan: ${plan.name}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to seed membership plans:', err);
  process.exit(1);
});
