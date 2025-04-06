/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable server-side rendering for dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
