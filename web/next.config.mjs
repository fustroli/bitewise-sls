import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

// Where `next dev` sends `/api/*`: the deployed API, behind CloudFront.
const DEV_API_ORIGIN =
  process.env.DEV_API_ORIGIN || 'https://sls.bitewise.rolandfuest.com';

/**
 * Static export: `next build` writes `out/`, which goes to the web bucket.
 * Security headers come from the CloudFront response headers policy.
 * @type {(phase: string) => import('next').NextConfig}
 */
const nextConfig = (phase) => ({
  output: 'export',
  // The SPA rewrite Function maps `/x` and `/x/` to `/x/index.html`.
  trailingSlash: true,
  // No image optimizer without a server.
  images: { unoptimized: true },
  poweredByHeader: false,
  // `@bitewise/shared` ships TypeScript source.
  transpilePackages: ['@bitewise/shared'],
  // Dev only (a static export has no server; CloudFront routes `/api/*`):
  // the app stays same-origin, so the API needs no CORS. Next warns that
  // rewrites don't work with `output: 'export'`; in dev they do. With
  // `trailingSlash`, a call first gets a 308 to `/api/x/`, which fetch follows.
  ...(phase === PHASE_DEVELOPMENT_SERVER && {
    async rewrites() {
      return [
        { source: '/api/:path*', destination: `${DEV_API_ORIGIN}/api/:path*` },
      ];
    },
  }),
});

export default nextConfig;
