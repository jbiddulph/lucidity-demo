/**
 * GET /api/lucidity/status
 *
 * Connection status for the demo UI (reads .env / runtime config).
 */
export default defineEventHandler(() => {
  const { baseUrl, apiKey, useMock } = getLucidityRuntime()

  return {
    configured: isLucidityConfigured(),
    useMock,
    baseUrl: baseUrl || null,
    // Safe hint so we can confirm which key is active without exposing it
    apiKeyHint: apiKey ? `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}` : null,
    // Lucidity document query endpoint
    queryUrl: baseUrl ? `${baseUrl}/api/query` : null,
    // Lucidity schema catalog endpoint
    schemaTypesUrl: baseUrl ? `${baseUrl}/api/query/schema-types` : null,
  }
})
