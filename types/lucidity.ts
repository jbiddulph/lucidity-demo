export type LucidityDocument = Record<string, unknown> & {
  _type?: string
  _id?: string
  _publishedAt?: string
}

export interface LuciditySchemaType {
  id: string
  name: string
  title: string
  description?: string
  icon?: string
  fields?: unknown[]
  raw: LucidityDocument
}

export interface LucidityTypeBucket {
  type: LuciditySchemaType
  documents: LucidityDocument[]
}

export interface LucidityNavItem {
  id: string
  title: string
  slug: string
  path: string
}

/**
 * One "Include content" collection from a Page.
 * Lucidity shape example:
 * { type: "post", relation: "all", items: [ /* post docs *\/ ] }
 */
export interface LucidityIncludedCollection {
  typeName: string
  relation: string | null
  schema: LuciditySchemaType | null
  documents: LucidityDocument[]
}

/** @deprecated use LuciditySlugPayload — kept for older call sites */
export interface LucidityPagePayload {
  page: LucidityDocument
  included: LucidityIncludedCollection[]
}

/**
 * Resolved /:slug payload.
 * - kind "page": Lucidity Page (+ optional Include content loops)
 * - kind "document": any other schema doc matched by slug (post, author, …)
 */
export interface LucidityDisplayField {
  name: string
  /** Human label from schema field title, e.g. "Published at" */
  label: string
  type: string
  /** Raw Lucidity value (id, datetime string, …) */
  value: unknown
  /** Ready-to-show text (author name, formatted date, …) */
  text: string
  href?: string | null
}

export interface LuciditySlugPayload {
  kind: 'page' | 'document'
  /** The matched Lucidity document (page, post, author, …) */
  document: LucidityDocument
  schema: LuciditySchemaType | null
  /** Schema-aware fields for detail views (labels + resolved references) */
  fields: LucidityDisplayField[]
  /** Only set when kind === "page" */
  included: LucidityIncludedCollection[]
}

export interface LucidityDemoPayload {
  source: 'mock' | 'live'
  fetchedAt: string
  schemaTypes: LuciditySchemaType[]
  types: LucidityTypeBucket[]
  /** Site navigation built from the Page schema type, when present */
  navigation: LucidityNavItem[]
  pageSchemaName: string | null
  note?: string
}
