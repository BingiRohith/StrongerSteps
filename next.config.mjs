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
  // lucide-react ships every icon as a separate module behind one barrel
  // `dist/esm/lucide-react.js` (1600+ icon files). `import { X } from
  // 'lucide-react'` is used in 90+ files across the app (incl. every
  // Header/Footer render, i.e. every route); Next's dev compiler resolves
  // that whole barrel graph the first time any route touches even one
  // icon, which is most of the multi-second "Compiling /x..." time seen on
  // first navigation to each route. `optimizePackageImports` doesn't catch
  // this for lucide-react (its barrel does `import * as index from
  // './icons/index.js'`, a namespace re-export that defeats Next's static
  // analysis), so this rewrites each named icon import directly to its own
  // file at build time instead. Purely an import-path rewrite — same
  // icons, same props, same render output.
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{ kebabCase member }}',
    },
  },
};

export default nextConfig;
