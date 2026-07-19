import type { NextConfig } from "next";

import { buildContentSecurityPolicy } from "./lib/security-headers";

const backendRewriteDestination = (
  process.env.LANGCLAW_BACKEND_REWRITE_URL || "http://43.129.56.85/celo"
).replace(/\/+$/, "");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: buildContentSecurityPolicy({
      isDevelopment: process.env.NODE_ENV === "development",
    }),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["langclawcelo.vercel.app"],
  devIndicators: false,
  async headers() {
    return [
      {
        headers: securityHeaders,
        source: "/(.*)",
      },
    ];
  },
  async rewrites() {
    return [
      {
        destination: `${backendRewriteDestination}/:path*`,
        source: "/api/backend/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "zwagiicvlhayuknccnhc.supabase.co",
        pathname: "/storage/v1/object/public/image/**",
        protocol: "https",
      },
    ],
  },
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
