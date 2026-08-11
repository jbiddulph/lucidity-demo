import type {
  LucidityDemoPayload,
  LucidityDocument,
  LucidityIncludedCollection,
  LucidityNavItem,
  LucidityPagePayload,
  LuciditySchemaType,
} from '../../types/lucidity'
import { getMockContent, getMockSchemaTypes } from './lucidity-mock'

/** Page fields that can point at another schema to loop on the page */
const INCLUDE_TYPE_FIELDS = [
  'includeType',
  'include_type',
  'contentType',
  'content_type',
  'schemaType',
  'schema_type',
  'loopType',
  'loop_type',
  'collection',
] as const

export function getLucidityRuntime() {
  const config = useRuntimeConfig()
  const rawBase = String(config.lucidity.baseUrl || '').trim()
  const baseUrl = rawBase
    .replace(/\/api\/query.*$/i, '')
    .replace(/\/$/, '')
  const apiKey = String(config.lucidity.apiKey || '').trim()
  const useMock = Boolean(config.lucidityUseMock) || !baseUrl || !apiKey

  return { baseUrl, apiKey, useMock }
}

export function isLucidityConfigured() {
  const { baseUrl, apiKey } = getLucidityRuntime()
  return Boolean(baseUrl && apiKey)
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'x-api-key': apiKey,
  }
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

export function normalizeSchemaType(doc: LucidityDocument, index: number): LuciditySchemaType | null {
  const contentName = asString(doc.name) || asString(doc.slug)
  if (!contentName) return null

  const title = asString(doc.title) || contentName
  const id = asString(doc._id) || asString(doc.id) || `${contentName}-${index}`

  return {
    id,
    name: contentName,
    title,
    description: asString(doc.description) || undefined,
    icon: asString(doc.icon) || undefined,
    fields: Array.isArray(doc.fields) ? doc.fields : undefined,
    raw: doc,
  }
}

function isPageSchema(type: LuciditySchemaType) {
  const name = type.name.toLowerCase()
  const title = type.title.toLowerCase()
  return name === 'page' || name === 'pages' || title === 'page' || title === 'pages'
}

export function toNavItem(doc: LucidityDocument): LucidityNavItem | null {
  const slug = asString(doc.slug)
  if (!slug) return null

  const title = asString(doc.title) || asString(doc.name) || slug
  const id = asString(doc._id) || slug

  return {
    id,
    title,
    slug,
    path: `/${slug}`,
  }
}

function coerceTypeName(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>
    return (
      asString(record.name)
      || asString(record.slug)
      || asString(record.value)
      || asString(record.type)
      || null
    )
  }

  return null
}

/**
 * Resolve which schema type a page wants to include/loop.
 * Supports string values and simple reference/select objects from Lucidity.
 */
export function resolveIncludeType(page: LucidityDocument): string | null {
  for (const field of INCLUDE_TYPE_FIELDS) {
    const resolved = coerceTypeName(page[field])
    if (resolved) return resolved
  }

  for (const field of ['includeTypes', 'include_types', 'contentTypes', 'content_types'] as const) {
    const value = page[field]
    if (Array.isArray(value) && value.length) {
      const resolved = coerceTypeName(value[0])
      if (resolved) return resolved
    }
  }

  return null
}

async function lucidityGet<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
  const { baseUrl, apiKey } = getLucidityRuntime()

  return $fetch<T>(`${baseUrl}${path}`, {
    method: 'GET',
    query,
    headers: authHeaders(apiKey),
  })
}

export async function lucidityQuery(
  type: string,
  query: Record<string, string | undefined> = {},
): Promise<LucidityDocument[]> {
  const { useMock } = getLucidityRuntime()
  const normalizedType = type.trim()

  if (!normalizedType) {
    return []
  }

  if (useMock) {
    return getMockContent(normalizedType)
  }

  try {
    const data = await lucidityGet<LucidityDocument[]>('/api/query', {
      type: normalizedType,
      ...query,
    })
    return Array.isArray(data) ? data : []
  }
  catch (error: unknown) {
    const statusCode =
      typeof error === 'object'
      && error
      && 'statusCode' in error
      && typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 502

    const message =
      typeof error === 'object'
      && error
      && 'statusMessage' in error
      && typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
        ? (error as { statusMessage: string }).statusMessage
        : `Lucidity query failed for type="${normalizedType}"`

    throw createError({
      statusCode,
      statusMessage: message,
      data: error,
    })
  }
}

/**
 * Discover content types from Lucidity.
 * Public contract: GET /api/query/schema-types
 */
export async function discoverSchemaTypes(): Promise<{ types: LuciditySchemaType[], note?: string }> {
  const { useMock } = getLucidityRuntime()

  if (useMock) {
    return {
      types: getMockSchemaTypes()
        .map((doc, index) => normalizeSchemaType(doc, index))
        .filter(Boolean) as LuciditySchemaType[],
    }
  }

  try {
    const data = await lucidityGet<LucidityDocument[]>('/api/query/schema-types')
    const list = Array.isArray(data) ? data : []
    const types = [...new Map(
      list
        .map((doc, index) => normalizeSchemaType(doc, index))
        .filter(Boolean)
        .map((type) => [type!.name, type!]),
    ).values()]

    if (types.length) {
      return { types }
    }

    return {
      types: [],
      note: 'GET /api/query/schema-types returned no types for this API key.',
    }
  }
  catch (error: unknown) {
    const message =
      typeof error === 'object'
      && error
      && 'statusMessage' in error
      && typeof (error as { statusMessage?: unknown }).statusMessage === 'string'
        ? (error as { statusMessage: string }).statusMessage
        : 'Failed to load /api/query/schema-types'

    return {
      types: [],
      note: message,
    }
  }
}

export async function lucidityFetchAll(): Promise<LucidityDemoPayload> {
  const { useMock } = getLucidityRuntime()
  const discovered = await discoverSchemaTypes()

  const types = await Promise.all(
    discovered.types.map(async (type) => ({
      type,
      documents: await lucidityQuery(type.name),
    })),
  )

  const pageBucket = types.find((bucket) => isPageSchema(bucket.type))
  const navigation = (pageBucket?.documents || [])
    .map((doc) => toNavItem(doc))
    .filter(Boolean) as LucidityNavItem[]

  return {
    source: useMock ? 'mock' : 'live',
    fetchedAt: new Date().toISOString(),
    schemaTypes: discovered.types,
    types,
    navigation,
    pageSchemaName: pageBucket?.type.name || null,
    note: discovered.note,
  }
}

export async function lucidityGetPageBySlug(slug: string): Promise<LucidityPagePayload | null> {
  const discovered = await discoverSchemaTypes()
  const pageType = discovered.types.find((type) => isPageSchema(type))

  if (!pageType) {
    return null
  }

  const pages = await lucidityQuery(pageType.name)
  const page = pages.find((doc) => asString(doc.slug) === slug) || null

  if (!page) {
    return null
  }

  const includeType = resolveIncludeType(page)
  let included: LucidityIncludedCollection | null = null

  if (includeType) {
    const schema = discovered.types.find((type) => type.name === includeType) || null
    const documents = await lucidityQuery(includeType)
    included = {
      typeName: includeType,
      schema,
      documents,
    }
  }

  return {
    page,
    includeType,
    included,
  }
}
