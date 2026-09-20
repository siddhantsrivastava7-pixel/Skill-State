import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: "/skillstate",
  // pdf-parse uses server-side Node packages (fs, etc.), ensure server external packages if needed
  serverExternalPackages: ["pdf-parse", "mammoth"],
};

export default nextConfig;
