import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Enables forbidden() / app/forbidden.tsx, used by the permission checks.
    authInterrupts: true,
    serverActions: {
      // Customer images (max 2 MB) are sent through a Server Action, whose default limit is 1 MB.
      bodySizeLimit: '3mb',
    },
  },
};

export default nextConfig;
