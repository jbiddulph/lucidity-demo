export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing page slug' })
  }

  const payload = await lucidityGetPageBySlug(slug)

  if (!payload) {
    throw createError({ statusCode: 404, statusMessage: `Page not found: ${slug}` })
  }

  return payload
})
