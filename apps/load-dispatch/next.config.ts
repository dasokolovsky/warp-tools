import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@warp-tools/ui', '@warp-tools/config'],
};

export default nextConfig;
