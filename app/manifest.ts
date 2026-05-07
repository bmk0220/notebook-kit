import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Notebook Kit',
    short_name: 'Notebook Kit',
    description: 'Discover and collect professional NotebookLM-ready source kits.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#d54d69',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
