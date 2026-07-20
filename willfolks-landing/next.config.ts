import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.16"],
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
