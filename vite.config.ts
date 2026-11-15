/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// booqy.json skrivs av Booqy (site-repo) när kunden skapas i Booqy Console:
// en sektion per miljö med restaurangens tenantId, API:t och de publika
// nycklarna. Inget i den är hemligt. BOOQY_ENV väljer sektion: dev (standard,
// också för npm run dev), prod (deployen från main i BooqyCustomers) eller
// test (deployen från main för en testkund i BooqyCustomersDev). Ett värde i
// .env.local går före booqy.json, t.ex. VITE_API_BASE_URL.
type EnvironmentConfig = {
  tenantId?: string
  apiBaseUrl?: string
  menuImageBaseUrl?: string
  domain?: string
}
type BooqyJson = { slug?: string; environments?: Record<string, EnvironmentConfig> }

function readBooqyJson(): BooqyJson {
  try {
    return JSON.parse(readFileSync(new URL('./booqy.json', import.meta.url), 'utf8')) as BooqyJson
  } catch {
    return {}
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const requested = process.env.BOOQY_ENV
  const booqyEnv: 'prod' | 'test' | 'dev' = requested === 'prod' || requested === 'test' ? requested : 'dev'
  const booqy = readBooqyJson()
  const site = booqy.environments?.[booqyEnv] ?? {}
  const apiTarget = env.VITE_API_BASE_URL || site.apiBaseUrl || ''
  const menuImageBaseUrl = env.VITE_MENU_IMAGE_BASE_URL || site.menuImageBaseUrl || ''
  // Slug-uppslagningen fungerar bara utanför prod (localhost, förhandsvisningen, testsajterna).
  const devTenantSlug = booqyEnv === 'prod' ? '' : env.VITE_DEV_TENANT_SLUG || booqy.slug || ''
  // Restaurangens egen domän (prod), för canonical-länken. Testsajter har ingen.
  const ownDomain = booqy.environments?.prod?.domain ?? ''
  // I dev proxas API-anropen genom dev-servern (samma origin) i stället för
  // att webbläsaren pratar direkt med API Gateway.
  const useDevProxy = mode === 'development' && /^https?:/.test(apiTarget)

  return {
    plugins: [
      react(),
      {
        // CSP:ns connect-src får API:ts origin från bygget.
        name: 'csp-api-origin',
        transformIndexHtml(html) {
          let origin = 'https://*.execute-api.eu-north-1.amazonaws.com'
          try {
            if (/^https:\/\//.test(apiTarget)) origin = new URL(apiTarget).origin
          } catch {
            // ogiltig URL - behåll standardvärdet
          }
          return html.replaceAll('%API_ORIGIN%', origin)
        },
      },
      {
        // Förhandsvisningen (<slug>.dev.booqy.se) och testsajterna
        // (<slug>.test.booqy.se, <slug>.test-dev.booqy.se) ska aldrig indexeras;
        // bara restaurangens egen domän (canonical, sätts per sida i main.tsx).
        name: 'noindex-outside-prod',
        transformIndexHtml(html) {
          if (booqyEnv === 'prod') return html
          return html.replace('</title>', '</title>\n    <meta name="robots" content="noindex, nofollow" />')
        },
      },
      {
        // CSP:n i index.html är skriven för den byggda sajten; Vites dev-läge
        // behöver inline-skript, så i dev tas meta-taggen bort.
        name: 'strip-csp-in-dev',
        apply: 'serve',
        transformIndexHtml(html) {
          return html.replace(/\s*<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/, '')
        },
      },
    ],
    cacheDir: mode === 'test' ? 'node_modules/.vitest' : 'node_modules/.vite',
    define:
      mode === 'test'
        ? {}
        : {
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(useDevProxy ? '/api' : apiTarget),
            'import.meta.env.VITE_MENU_IMAGE_BASE_URL': JSON.stringify(menuImageBaseUrl),
            'import.meta.env.VITE_DEV_TENANT_SLUG': JSON.stringify(devTenantSlug),
            'import.meta.env.VITE_CANONICAL_ORIGIN': JSON.stringify(ownDomain ? `https://${ownDomain}` : ''),
          },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: './src/test/setup.ts',
      globals: true,
      env: { VITE_API_BASE_URL: 'https://api.test' },
    },
    server: {
      port: 7071,
      strictPort: true,
      proxy: useDevProxy
        ? {
            '/api': {
              target: apiTarget,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
  }
})
