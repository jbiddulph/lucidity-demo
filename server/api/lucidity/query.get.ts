/**
 * GET /api/lucidity/query?type=…
 *
 * Thin passthrough to Lucidity:
 *   GET {LUCIDITY}/api/query?type={type}
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = String(query.type || '').trim()

  if (!type) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Query param "type" is required (e.g. ?type=page)',
    })
  }

  return lucidityQuery(type)
})
