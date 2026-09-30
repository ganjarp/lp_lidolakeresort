import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger body for image uploads (50MB)
  serverExternalPackages: ['bcryptjs', 'jsonwebtoken'],
};

export default nextConfig;
