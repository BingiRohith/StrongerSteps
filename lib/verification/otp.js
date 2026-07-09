import bcrypt from 'bcryptjs';

const OTP_LENGTH = 6;
const SALT_ROUNDS = 10;

/** Generates a zero-padded numeric OTP, e.g. "042917". */
export function generateOtp() {
  const max = 10 ** OTP_LENGTH;
  const value = Math.floor(Math.random() * max);
  return String(value).padStart(OTP_LENGTH, '0');
}

/** Never store the plain OTP — only this hash. */
export async function hashOtp(otp) {
  return bcrypt.hash(otp, SALT_ROUNDS);
}

export async function compareOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}
