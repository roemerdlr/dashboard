import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Customer images uploaded to Vercel Blob.
    remotePatterns: [
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    serverActions: {
      // Customer images (max 2 MB) are sent through a Server Action, whose default limit is 1 MB.
      bodySizeLimit: '3mb',
    },
  },
};

export default nextConfig;
