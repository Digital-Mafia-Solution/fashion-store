import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
  "name": "Splaza Online Store",
  "short_name": "Splaza",
  "description": "Get local, online.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f0f7f6",
  "theme_color": "#f0f7f6",
  "icons": [
    {
      "src": "/icons/pwa.svg",
      "sizes": "any",
      "type": "image/png"
    }
  ]
}

}