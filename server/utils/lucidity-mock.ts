import type { LucidityDocument } from '../../types/lucidity'

const schemaTypes: LucidityDocument[] = [
  {
    _type: 'schema',
    _id: 'mock-schema-page',
    name: 'page',
    title: 'Page',
    description: 'Static pages. Optional includeType selects another schema to list on the page.',
    icon: 'page',
    fields: [
      { name: 'title', type: 'string', title: 'Title', required: true },
      { name: 'slug', type: 'slug', title: 'Slug', required: true },
      { name: 'body', type: 'text', title: 'Body' },
      {
        name: 'includeType',
        type: 'string',
        title: 'Include content type',
        description: 'Schema name to loop on this page, e.g. post',
      },
    ],
  },
  {
    _type: 'schema',
    _id: 'mock-schema-post',
    name: 'post',
    title: 'Post',
    description: 'Blog posts and articles',
    icon: 'article',
    fields: [
      { name: 'title', type: 'string', title: 'Title', required: true },
      { name: 'slug', type: 'slug', title: 'Slug', required: true },
      { name: 'excerpt', type: 'text', title: 'Excerpt' },
      { name: 'body', type: 'text', title: 'Body', required: true },
      { name: 'author', type: 'reference', title: 'Author' },
    ],
  },
  {
    _type: 'schema',
    _id: 'mock-schema-author',
    name: 'author',
    title: 'Author',
    description: 'People who write content',
    icon: 'person',
    fields: [
      { name: 'name', type: 'string', title: 'Name', required: true },
      { name: 'slug', type: 'slug', title: 'Slug' },
      { name: 'bio', type: 'text', title: 'Bio' },
    ],
  },
]

const documentsByType: Record<string, LucidityDocument[]> = {
  page: [
    {
      _type: 'page',
      _id: 'mock-page-about',
      _publishedAt: '2026-08-11T08:50:10.374Z',
      title: 'About us',
      slug: 'about-us',
      body: 'This is the about us page.',
    },
    {
      _type: 'page',
      _id: 'mock-page-blog',
      _publishedAt: '2026-08-11T08:51:10.374Z',
      title: 'Blog',
      slug: 'blog',
      body: 'Latest writing from the team.',
      includeType: 'post',
    },
    {
      _type: 'page',
      _id: 'mock-page-team',
      _publishedAt: '2026-08-11T08:52:10.374Z',
      title: 'Team',
      slug: 'team',
      body: 'Meet the people behind the work.',
      includeType: 'author',
    },
  ],
  post: [
    {
      _type: 'post',
      _id: 'mock-post-1',
      _publishedAt: '2026-08-10T23:19:53.497Z',
      title: 'This is the first post',
      slug: 'this-is-the-first-post',
      body: 'Hello from a mock post.',
      excerpt: 'first post',
      author: 'john-biddulph',
    },
    {
      _type: 'post',
      _id: 'mock-post-2',
      _publishedAt: '2026-08-11T10:00:00.000Z',
      title: 'Shipping schema-driven pages',
      slug: 'shipping-schema-driven-pages',
      body: 'Pages can include another content type and loop it.',
      excerpt: 'Include posts on a Blog page.',
      author: 'john-biddulph',
    },
  ],
  author: [
    {
      _type: 'author',
      _id: 'mock-author-1',
      _publishedAt: '2026-08-10T23:20:25.135Z',
      name: 'John Biddulph',
      slug: 'john-biddulph',
      bio: 'Builds headless CMS demos and Nuxt apps.',
    },
  ],
}

export function getMockSchemaTypes() {
  return schemaTypes
}

export function getMockContent(type: string) {
  return documentsByType[type] ?? []
}
