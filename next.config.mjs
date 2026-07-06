/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // NOTE: `output: 'export'` was removed. Static export disables API routes
  // and middleware entirely, so it can't coexist with the backend
  // (MongoDB + auth) added in this sprint. The app now builds as a normal
  // Next.js server app; all existing pages are unaffected and still render
  // the same way, they're just served by `next start` instead of static
  // files.
};

export default nextConfig;
