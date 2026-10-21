/**
 * Static export: `next build` writes `out/`, which goes to the web bucket.
 * Security headers come from the CloudFront response headers policy.
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'export',
  // The SPA rewrite Function maps `/x` and `/x/` to `/x/index.html`.
  trailingSlash: true,
  // No image optimizer without a server.
  images: { unoptimized: true },
  poweredByHeader: false,
  // `@bitewise/shared` ships TypeScript source.
  transpilePackages: ['@bitewise/shared'],
};

export default nextConfig;
