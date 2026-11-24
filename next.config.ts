import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static ships a native binary that must stay outside the server bundle.
  serverExternalPackages: ["ffmpeg-static"],
  outputFileTracingIncludes: {
    "/api/jobs/**": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/projects/**": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/media/**": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
