import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Add other image hostnames if needed in the future
      // e.g. for product images from a specific CDN
      // {
      //   protocol: 'https',
      //   hostname: 'cdn.example.com',
      //   port: '',
      //   pathname: '/images/**',
      // },
    ],
  },
};

export default nextConfig;
