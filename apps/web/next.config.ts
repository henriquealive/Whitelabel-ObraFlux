import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@obraflux/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
