import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client-state prototype with no server data: Cache Components / partial prefetching add constraints
  // (e.g. mandatory <Suspense> around usePathname) without benefit, so they are disabled.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
