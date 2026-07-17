import { pathToFileURL } from 'node:url';

const projectRoot = pathToFileURL(process.cwd() + '/').href;

/**
 * Rewrites the project's `@/` import alias (jsconfig.json's `baseUrl`/
 * `paths`, resolved by Next.js's own bundler at dev/build time) to a plain
 * relative-to-root file URL, so `node --test` can resolve the same source
 * files without pulling in a bundler as a test dependency.
 */
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rest = specifier.slice(2);
    // Next.js's bundler resolves extensionless imports (e.g. '@/lib/auth');
    // Node's native ESM loader does not, so append .js when none is given.
    const withExt = /\.[a-z]+$/i.test(rest) ? rest : `${rest}.js`;
    return nextResolve(new URL(withExt, projectRoot).href, context);
  }
  return nextResolve(specifier, context);
}
