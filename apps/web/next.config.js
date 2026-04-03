/** @type {import('next').NextConfig} */
const nextConfig = {
  // mermaid uses browser APIs — ensure it's only bundled client-side
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
};

module.exports = nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
