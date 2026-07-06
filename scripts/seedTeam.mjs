/**
 * One-time bootstrap script to seed the Team collection with the founders
 * and team members that used to be hardcoded on the About page, so the page
 * keeps working immediately after the Team admin module ships.
 *
 * Usage:
 *   node scripts/seedTeam.mjs
 *
 * Safe to re-run: it skips any name that already exists and does not touch
 * existing team members.
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

const TeamSchema = new mongoose.Schema(
  {
    name: String,
    designation: String,
    qualifications: { type: [String], default: [] },
    experience: { type: String, default: '' },
    bio: { type: String, default: '' },
    photo: {
      url: { type: String, default: '' },
      alt: { type: String, default: '' },
    },
    social: {
      linkedin: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    displayOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

const SEED_MEMBERS = [
  { name: 'Dr. Nikhil', designation: 'Co-founder', featured: true, displayOrder: 1 },
  { name: 'Dr. Akhila', designation: 'Co-founder', featured: true, displayOrder: 2 },
  { name: 'Dr. Rajesh', designation: 'Team Member', featured: false, displayOrder: 3 },
  { name: 'Dr. Vamshi', designation: 'Team Member', featured: false, displayOrder: 4 },
];

async function run() {
  await mongoose.connect(MONGODB_URI);

  for (const member of SEED_MEMBERS) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Team.findOne({ name: member.name });
    if (existing) {
      console.log(`"${member.name}" already exists. Skipping.`);
      continue; // eslint-disable-line no-continue
    }

    // eslint-disable-next-line no-await-in-loop
    await Team.create({
      ...member,
      status: 'published',
      publishedAt: new Date(),
    });
    console.log(`Created team member: ${member.name}`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to seed team members:', err);
  process.exit(1);
});
