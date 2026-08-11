/**
 * GET /api/lucidity/pages/:slug
 *
 * Resolves any Lucidity document by slug (not only Pages):
 *   1. GET {LUCIDITY}/api/query/schema-types
 *   2. GET {LUCIDITY}/api/query?type=page     → match Page slug (e.g. /blog)
 *   3. Else GET {LUCIDITY}/api/query?type=…  → match post/author/etc. (e.g. /first-blog-post)
 *   4. For Pages, also resolve page.items ("Include content") collections
 *
 * Route name kept as /pages/:slug for backwards compatibility with the demo UI.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing slug' })
  }

  // See server/utils/lucidity.ts → lucidityGetBySlug()
  const payload = await lucidityGetBySlug(slug)

  if (!payload) {
    throw createError({ statusCode: 404, statusMessage: `Content not found: ${slug}` })
  }

  return payload
})
