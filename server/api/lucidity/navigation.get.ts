/**
 * GET /api/lucidity/navigation
 *
 * Builds the site header links from Lucidity Pages:
 *   GET {LUCIDITY}/api/query/schema-types
 *   GET {LUCIDITY}/api/query?type=page
 * Each page title + slug becomes a nav item (e.g. /blog, /about-us).
 */
export default defineEventHandler(async () => {
  const payload = await lucidityFetchAll()
  return payload.navigation
})
