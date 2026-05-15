/** @type {import('next').NextConfig} */
const nextConfig = {
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
