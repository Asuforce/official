import { defineConfig, loadEnv, type Plugin } from 'vite'

// PoC: inject the Cloudflare Web Analytics beacon at build time.
// Set CF_BEACON_TOKEN (shell env or .env.local) to enable; without it the
// build output is unchanged, so local dev and forks stay free of tracking.
// See docs/cloudflare-analytics.md.
function cloudflareWebAnalytics(token: string | undefined): Plugin {
  return {
    name: 'cloudflare-web-analytics',
    apply: 'build',
    transformIndexHtml() {
      if (!token) return
      return [
        {
          tag: 'script',
          attrs: {
            defer: true,
            src: 'https://static.cloudflareinsights.com/beacon.min.js',
            'data-cf-beacon': JSON.stringify({ token }),
          },
          injectTo: 'head',
        },
      ]
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['CF_', 'VITE_'])
  return {
    plugins: [cloudflareWebAnalytics(env.CF_BEACON_TOKEN)],
    build: {
      outDir: 'dist',
    },
  }
})
