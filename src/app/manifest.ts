import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ClassroomTimers',
    short_name: 'ClassroomTimers',
    description: 'Clear, reliable classroom timers and clocks.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0B0C',
    theme_color: '#0B0B0C',
    icons: [
      {
        src: '/app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/app-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
