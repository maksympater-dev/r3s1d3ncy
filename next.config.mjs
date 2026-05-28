/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/r3-signal-bypass',
        destination: '/r3-signal-bypass/index.html',
      },
    ]
  },
}

export default nextConfig
