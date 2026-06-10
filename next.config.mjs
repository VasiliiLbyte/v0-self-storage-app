/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    formats: ["image/webp", "image/avif"],
  },
}

export default nextConfig
