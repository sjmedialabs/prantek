/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: "/videos", destination: "/help-center", permanent: true }]
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
