/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack is now the default dev compiler in Next.js 15
  // This can be removed if not needed, but keeping for clarity
  turbopack: {
    // Turbopack options if needed
  },
}

module.exports = nextConfig
