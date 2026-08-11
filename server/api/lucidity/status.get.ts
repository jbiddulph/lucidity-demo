export default defineEventHandler(() => {
  const { baseUrl, useMock } = getLucidityRuntime()

  return {
    configured: isLucidityConfigured(),
    useMock,
    baseUrl: baseUrl || null,
    queryUrl: baseUrl ? `${baseUrl}/api/query` : null,
    schemaTypesUrl: baseUrl ? `${baseUrl}/api/query/schema-types` : null,
  }
})
