/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: false,
  // Hide the floating "N" Next.js dev indicator in the bottom-left corner.
  // It only renders during `next dev`, but we disable it explicitly so it
  // never appears in any environment.
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') + '/api/:path*',
      },
    ];
  },
};
module.exports = nextConfig;
