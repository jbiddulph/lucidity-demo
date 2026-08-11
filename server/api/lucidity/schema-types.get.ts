export default defineEventHandler(async () => {
  const payload = await lucidityFetchAll()
  return {
    schemaTypes: payload.schemaTypes,
    navigation: payload.navigation,
    pageSchemaName: payload.pageSchemaName,
    note: payload.note,
  }
})
