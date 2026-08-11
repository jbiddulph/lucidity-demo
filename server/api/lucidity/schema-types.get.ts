/**
 * GET /api/lucidity/schema-types
 *
 * Proxies Lucidity schema discovery used for content tabs:
 *   GET {LUCIDITY}/api/query/schema-types
 */
export default defineEventHandler(async () => {
  const payload = await lucidityFetchAll()
  return {
    schemaTypes: payload.schemaTypes,
    navigation: payload.navigation,
    pageSchemaName: payload.pageSchemaName,
    note: payload.note,
  }
})
