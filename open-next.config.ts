import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import staticAssetsIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache'

/**
 * Fully SSG site:
 * - Incremental cache lives in Workers Static Assets (fastest for SSG)
 * - Cache interception skips NextServer on cache hits (cheaper Worker CPU)
 *
 * Static files (/_next/static, images, …) are served by Cloudflare Assets with
 * run_worker_first=false and never invoke the Worker.
 *
 * HTML still enters the Worker once (locale middleware). Set CDN Cache Rules on
 * the zone so subsequent HTML is served from edge cache (see deploy notes).
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  enableCacheInterception: true,
})
