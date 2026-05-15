/** @type {import('next').NextConfig} */
const nextConfig = {
  /** No `X-Powered-By: Next.js` (unrelated to `<meta name="generator">`, but cleaner headers). */
  poweredByHeader: false,
  /** Avoid infinite hang when Supabase is slow during `Collecting page data`. */
  staticPageGenerationTimeout: 180,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    /** Infomaniak VMs: fewer parallel page-data workers → less Supabase stampede at build. */
    cpus: 2,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "duxolcnofoyizkzrrkux.supabase.co",
      },
    ],
  },
}

export default nextConfig
