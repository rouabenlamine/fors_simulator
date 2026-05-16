/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "chromadb", "onnxruntime-node"],
  },
  async rewrites() {
    return [
      {
        // Map /s/[matricule]/path to /path
        source: '/s/:sid/:path*',
        destination: '/:path*',
      },
    ];
  },
};

export default nextConfig;
