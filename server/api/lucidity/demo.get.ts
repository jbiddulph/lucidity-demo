/**
 * GET /api/lucidity/demo
 *
 * Aggregated payload for the home/demo screen:
 *   - schema types from GET /api/query/schema-types
 *   - documents per type from GET /api/query?type=…
 *   - navigation from Page documents
 */
export default defineEventHandler(async () => {
  return lucidityFetchAll()
})
