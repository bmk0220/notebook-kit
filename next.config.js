/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['stripe', '@paypal/paypal-server-sdk', 'nodemailer'],
};

module.exports = nextConfig;
