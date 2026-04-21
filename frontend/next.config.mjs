import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const nextVersion = require("next/package.json").version;
const nextMajor = Number.parseInt(nextVersion.split(".")[0] ?? "0", 10);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["talent.tmmethode.com"],
  ...(nextMajor >= 15
    ? {
        turbopack: {
          root: __dirname,
        },
      }
    : {}),
};

export default nextConfig;
