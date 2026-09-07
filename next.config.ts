import type { NextConfig } from "next";

// Next.js rejects Server Action POSTs with "Invalid Server Actions request."
// (error E80) when the browser's `Origin` header host does not match the
// `Host` header the server receives. Clerk registers an internal server
// action (`invalidateCacheAction`) on every page through <ClerkProvider>,
// and fires it on sign-in / sign-out / session changes. When the app is
// reached through a LAN IP or a tunnel / reverse proxy, the Origin no longer
// matches Host, so those origins must be allowlisted.
//
// Pattern rules: each dot-separated segment can be `*` (one segment) or `**`
// (rest of the host). The port is part of the last segment, e.g. the origin
// `http://10.0.0.5:3001` has host `10.0.0.5:3001`.
const devAllowedOrigins = [
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
  // Reachable by machine IP on common private ranges (any port)
  "10.*.*.*",
  "192.168.*.*",
  "172.16.*.*",
  "172.17.*.*",
  "172.18.*.*",
  "172.19.*.*",
  "172.20.*.*",
  "172.21.*.*",
  "172.22.*.*",
  "172.23.*.*",
  "172.24.*.*",
  "172.25.*.*",
  "172.26.*.*",
  "172.27.*.*",
  "172.28.*.*",
  "172.29.*.*",
  "172.30.*.*",
  "172.31.*.*",
];

const extraOrigins = (process.env.SERVER_ACTIONS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Backend origin for the /api reverse proxy. The browser ONLY talks to the
// frontend origin (same-site cookies); Next.js proxies /api/* to this origin.
// Override per-deployment via BACKEND_API_ORIGIN.
const backendApiOrigin =
  process.env.BACKEND_API_ORIGIN || "https://voteweb-backend-api.onrender.com";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // Proxy API traffic through this server so cookies (cv_sid, cv_csrf) are
  // first-party. The frontend and backend live on separate *.onrender.com
  // subdomains (different sites under the public-suffix list); without this,
  // iOS Safari's ITP blocks the cross-site cookies and login always fails.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendApiOrigin}/api/:path*`,
      },
    ];
  },
  experimental: {
    serverActions: {
      // Keep the default strict check in production builds; only relax it for
      // local development / tunnels. For a production deployment behind a
      // proxy, set SERVER_ACTIONS_ALLOWED_ORIGINS to the public host(s),
      // e.g. SERVER_ACTIONS_ALLOWED_ORIGINS="vote.example.com"
      allowedOrigins:
        process.env.NODE_ENV !== "production"
          ? [...devAllowedOrigins, ...extraOrigins]
          : extraOrigins,
    },
  },
};

export default nextConfig;
