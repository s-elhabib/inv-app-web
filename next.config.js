/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable server-side rendering for dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  webpack: (config) => {
    // Ignore WebSocket warnings from Supabase
    config.ignoreWarnings = [
      { module: /node_modules\/ws\/lib\/buffer-util\.js/ },
      { module: /node_modules\/ws\/lib\/validation\.js/ }
    ];
    return config;
  },
};

module.exports = nextConfig;
