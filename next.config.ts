import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Na Vercel, o build padrão é otimizado — não precisamos de "standalone"
  // (standalone é pra self-host com Node server, não pra serverless da Vercel)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
