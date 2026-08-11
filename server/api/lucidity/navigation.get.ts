export default defineEventHandler(async () => {
  const payload = await lucidityFetchAll()
  return payload.navigation
})
