import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Ignore les erreurs ESLint pendant la construction afin que Vercel se concentre sur la compilation.
    // Les avertissements continueront d’apparaître dans les logs, mais n’interrompront plus le déploiement.
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
