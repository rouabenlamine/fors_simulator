/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mysql2", "chromadb", "onnxruntime-node"],
  },
};

export default nextConfig;
