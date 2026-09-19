import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // pdf-parse uses server-side Node packages (fs, etc.), ensure server external packages if needed
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
