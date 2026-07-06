/**
 * One-time bootstrap script to create the first admin account.
 *
 * Usage:
 *   node scripts/createAdmin.mjs
 *
 * Reads ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD from .env.local (or the
 * environment). Safe to re-run: it will skip creation if a user with that
 * email already exists, and it will not touch existing users.
 */
import dotenv from 'dotenv';

dotenv.config({
  path: '.env.local'
});

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in your environment (.env.local).');
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in your environment (.env.local).');
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: String,
    role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);

  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`A user with email "${email}" already exists. Nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: ADMIN_NAME,
    email,
    password: hashedPassword,
    role: 'admin',
    isActive: true,
  });

  console.log(`Admin user created: ${email}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Failed to create admin user:', err);
  process.exit(1);
});
