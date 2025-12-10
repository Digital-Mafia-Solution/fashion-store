import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Fashion Store',
    short_name: 'Fashion',
    description: 'Local fashion, online.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icons/pwa-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-256x256.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}