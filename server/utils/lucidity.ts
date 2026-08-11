import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  LucidityDemoPayload,
  LucidityDocument,
  LucidityIncludedCollection,
  LucidityNavItem,
  LucidityPagePayload,
  LuciditySchemaType,
  LuciditySlugPayload,
} from '../../types/lucidity'
import { getMockContent, getMockSchemaTypes } from './lucidity-mock'

// ---------------------------------------------------------------------------
// Runtime config
// Reads LUCIDITY_BASE_URL + LUCIDITY_API_KEY from Nuxt runtimeConfig / .env
// ---------------------------------------------------------------------------

/**
 * Resolve Lucidity connection settings.
 * Reads .env on each call (demo-friendly) so API key / base URL updates
 * apply without relying only on Nuxt runtimeConfig baked at boot.
 */
export function getLucidityRuntime() {
  const config = useRuntimeConfig()
  const fileEnv = readLucidityEnvFile()

  const rawBase = String(
    fileEnv.LUCIDITY_BASE_URL
    || process.env.LUCIDITY_BASE_URL
    || config.lucidity.baseUrl
    || '',
  ).trim()

  // Allow pasting either the site origin or a full /api/query?... URL
  const baseUrl = rawBase
    .replace(/\/api\/query.*$/i, '')
    .replace(/\/$/, '')

  const apiKey = String(
    fileEnv.LUCIDITY_API_KEY
    || fileEnv.LUCIDITY_TOKEN
    || process.env.LUCIDITY_API_KEY
    || process.env.LUCIDITY_TOKEN
    || config.lucidity.apiKey
    || '',
  ).trim()

  const useMockFlag = (
    fileEnv.LUCIDITY_USE_MOCK
    || process.env.LUCIDITY_USE_MOCK
    || ''
  ).toLowerCase()

  const useMock = useMockFlag === 'true' || !baseUrl || !apiKey

  return { baseUrl, apiKey, useMock }
}

/** Parse project .env for Lucidity keys (simple KEY=VALUE lines). */
function readLucidityEnvFile(): Record<string, string> {
  try {
    const envPath = resolve(process.cwd(), '.env')
    if (!existsSync(envPath)) return {}

    const out: Record<string, string> = {}
    for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (key.startsWith('LUCIDITY_')) out[key] = value
    }
    return out
  }
  catch {
    return {}
  }
}

export function isLucidityConfigured() {
  const { baseUrl, apiKey } = getLucidityRuntime()
  return Boolean(baseUrl && apiKey)
}

/** Lucidity public API auth — API key via Bearer and x-api-key */
function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'x-api-key': apiKey,
  }
}

function asString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : ''
}

// ---------------------------------------------------------------------------
// Schema helpers
// ---------------------------------------------------------------------------

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

/** Map a Lucidity Page document into a site nav link */
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

// ---------------------------------------------------------------------------
// Lucidity HTTP helpers
// ---------------------------------------------------------------------------

/**
 * Low-level GET against the Lucidity workspace.
 * Example: lucidityGet('/api/query/schema-types')
 * Example: lucidityGet('/api/query', { type: 'post' })
 */
async function lucidityGet<T>(path: string, query?: Record<string, string | undefined>): Promise<T> {
  const { baseUrl, apiKey } = getLucidityRuntime()

  return $fetch<T>(`${baseUrl}${path}`, {
    method: 'GET',
    query,
    headers: authHeaders(apiKey),
  })
}

/**
 * Lucidity API: GET /api/query?type={schemaName}
 * Returns published documents for one content type (page, post, author, …).
 */
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
    // Lucidity document query — type is the schema "name" (e.g. "post")
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
 * Lucidity API: GET /api/query/schema-types
 * Returns every content type (schema) defined in the workspace.
 * Used to build content tabs and to recognise the Page schema for nav.
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

// ---------------------------------------------------------------------------
// Page "Include content" (collection field named `items`)
// Lucidity shape on a Page document:
//   items: [
//     { type: "post", relation: "all", items: [ /* post docs */ ] }
//   ]
// ---------------------------------------------------------------------------

function isCollectionEntry(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Turn Page.items (Include content) into loopable collections.
 * Prefer documents already embedded by Lucidity under entry.items.
 * If relation is "all" but the embedded list is empty, fall back to
 * GET /api/query?type={entry.type}.
 */
export async function resolveIncludedCollections(
  page: LucidityDocument,
  schemaTypes: LuciditySchemaType[],
): Promise<LucidityIncludedCollection[]> {
  const rawItems = page.items
  if (!Array.isArray(rawItems) || !rawItems.length) {
    return []
  }

  const collections: LucidityIncludedCollection[] = []

  for (const entry of rawItems) {
    if (!isCollectionEntry(entry)) continue

    const typeName = asString(entry.type)
    if (!typeName) continue

    const relation = asString(entry.relation) || null
    const schema = schemaTypes.find((type) => type.name === typeName) || null

    // Lucidity often embeds the selected documents on the page already
    let documents: LucidityDocument[] = Array.isArray(entry.items)
      ? entry.items.filter((doc): doc is LucidityDocument => isCollectionEntry(doc))
      : []

    // Fallback: fetch live documents for this schema type
    if (!documents.length) {
      documents = await lucidityQuery(typeName)
    }

    collections.push({
      typeName,
      relation,
      schema,
      documents,
    })
  }

  return collections
}

// ---------------------------------------------------------------------------
// High-level demo helpers
// ---------------------------------------------------------------------------

/** Load schemas + documents + page-based site navigation */
export async function lucidityFetchAll(): Promise<LucidityDemoPayload> {
  const { useMock } = getLucidityRuntime()

  // 1) Lucidity: list all schema types
  const discovered = await discoverSchemaTypes()

  // 2) Lucidity: for each schema, load its documents via /api/query?type=…
  const types = await Promise.all(
    discovered.types.map(async (type) => ({
      type,
      documents: await lucidityQuery(type.name),
    })),
  )

  // 3) If a Page schema exists, its documents become the site nav
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

/**
 * Resolve /:slug against Lucidity content.
 *
 * Order:
 *   1. Page schema (GET /api/query?type=page) — supports Include content loops
 *   2. Every other schema (post, author, …) until a matching slug is found
 *
 * This is why /blog works as a Page and /first-blog-post works as a Post.
 */
export async function lucidityGetBySlug(slug: string): Promise<LuciditySlugPayload | null> {
  const discovered = await discoverSchemaTypes()
  const pageType = discovered.types.find((type) => isPageSchema(type))

  // 1) Try Pages first
  if (pageType) {
    // Lucidity: GET /api/query?type=page
    const pages = await lucidityQuery(pageType.name)
    const page = pages.find((doc) => asString(doc.slug) === slug) || null

    if (page) {
      const included = await resolveIncludedCollections(page, discovered.types)
      return {
        kind: 'page',
        document: page,
        schema: pageType,
        included,
      }
    }
  }

  // 2) Fall back to other schema types (post, author, custom types, …)
  const otherTypes = discovered.types.filter((type) => !isPageSchema(type))

  for (const type of otherTypes) {
    // Lucidity: GET /api/query?type={type.name}
    const documents = await lucidityQuery(type.name)
    const document = documents.find((doc) => asString(doc.slug) === slug) || null

    if (document) {
      return {
        kind: 'document',
        document,
        schema: type,
        included: [],
      }
    }
  }

  return null
}

/**
 * @deprecated use lucidityGetBySlug — kept so older "pages only" call sites still work
 */
export async function lucidityGetPageBySlug(slug: string): Promise<LucidityPagePayload | null> {
  const resolved = await lucidityGetBySlug(slug)
  if (!resolved || resolved.kind !== 'page') return null

  return {
    page: resolved.document,
    included: resolved.included,
  }
}
