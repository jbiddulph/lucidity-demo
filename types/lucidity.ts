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

export interface LucidityIncludedCollection {
  typeName: string
  schema: LuciditySchemaType | null
  documents: LucidityDocument[]
}

export interface LucidityPagePayload {
  page: LucidityDocument
  includeType: string | null
  included: LucidityIncludedCollection | null
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
