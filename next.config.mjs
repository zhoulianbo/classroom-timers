import createNextIntlPlugin from 'next-intl/plugin'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    const contentSecurityPolicy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://*.vercel-scripts.com https://analytics.bufferbloattest.org",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://vitals.vercel-insights.com https://*.vercel-insights.com https://va.vercel-scripts.com https://analytics.bufferbloattest.org",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; ')

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value:
          'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), screen-wake-lock=(self), fullscreen=(self)',
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // CDN/edge cache for HTML (Worker responses). Browser keeps short TTL;
      // s-maxage lets Cloudflare Cache Rules / shared caches hold pages longer.
      {
        key: 'Cache-Control',
        value: 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800',
      },
    ]

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withNextIntl(nextConfig)

// Enable Cloudflare bindings during `next dev` (OpenNext adapter).
initOpenNextCloudflareForDev()
