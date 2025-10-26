/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    // Ignore RN-only dependency pulled by MetaMask SDK for web builds
    config.resolve.alias['@react-native-async-storage/async-storage'] = false
    return config
  },
}

export default nextConfig
