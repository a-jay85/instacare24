import type { NextConfig } from "next";

/**
 * Static export so the prototype can be served from GitHub Pages.
 * There is no backend, so nothing here needs a server.
 *
 * Project Pages live under https://<user>.github.io/<repo>/, so every asset
 * needs that prefix. It is env-gated: the deploy workflow sets
 * PAGES_BASE_PATH, local `next dev` leaves it empty and stays on "/".
 */
const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.PAGES_BASE_PATH ?? "",
  trailingSlash: true,
};

export default nextConfig;
