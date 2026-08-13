import type { LucidityDocument } from '../../types/lucidity'

/**
 * Local fixtures used when LUCIDITY_USE_MOCK=true.
 * Mirrors the live Lucidity shape, including Page.items collections.
 */
const schemaTypes: LucidityDocument[] = [
  {
    _type: 'schema',
    _id: 'mock-schema-page',
    name: 'page',
    title: 'Page',
    description: 'Static pages with optional Include content collections',
    icon: 'page',
    fields: [
      { name: 'title', type: 'string', title: 'Title', required: true },
      { name: 'slug', type: 'slug', title: 'Slug', required: true },
      { name: 'body', type: 'text', title: 'Body' },
      {
        name: 'items',
        type: 'collection',
        title: 'Include content',
        description: 'Select schema types to pull into this page',
        to: [],
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
      { name: 'author', type: 'reference', title: 'Author', to: ['author'] },
      { name: 'publishedAt', type: 'datetime', title: 'Published at' },
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
  {
    _type: 'schema',
    _id: 'mock-schema-homepage',
    name: 'homepage',
    title: 'Homepage',
    description: 'Site homepage hero content',
    icon: 'home',
    fields: [
      { name: 'title', type: 'string', title: 'Header text', required: true },
      { name: 'hero', type: 'image', title: 'Hero image' },
      { name: 'body', type: 'text', title: 'Body' },
    ],
  },
]

const posts: LucidityDocument[] = [
  {
    _type: 'post',
    _id: 'mock-post-1',
    _publishedAt: '2026-08-11T17:01:24.509Z',
    title: 'First Blog post',
    slug: 'first-blog-post',
    body: 'here',
    excerpt: '',
    author: 'mock-author-1',
    publishedAt: '2026-09-11T18:31',
  },
  {
    _type: 'post',
    _id: 'mock-post-2',
    _publishedAt: '2026-08-11T18:00:00.000Z',
    title: 'Second post',
    slug: 'second-post',
    body: 'Another post for the Blog loop.',
    excerpt: 'Included via page.items',
    author: 'mock-author-1',
    publishedAt: 'now',
  },
]

const documentsByType: Record<string, LucidityDocument[]> = {
  page: [
    {
      _type: 'page',
      _id: 'mock-page-blog',
      _publishedAt: '2026-08-11T17:16:14.842Z',
      title: 'Blog',
      slug: 'blog',
      body: '',
      // Lucidity "Include content" collection — posts embedded on the page
      items: [
        {
          type: 'post',
          relation: 'all',
          items: posts,
        },
      ],
    },
    {
      _type: 'page',
      _id: 'mock-page-about',
      title: 'About us',
      slug: 'about-us',
      body: 'This is the about us page.',
      items: [],
    },
    {
      _type: 'page',
      _id: 'mock-page-services',
      title: 'Services',
      slug: 'services',
      body: 'Our services page.',
      items: [],
    },
  ],
  post: posts,
  author: [
    {
      _type: 'author',
      _id: 'mock-author-1',
      name: 'John Biddulph',
      slug: 'john-biddulph',
      bio: 'Builds headless CMS demos and Nuxt apps.',
    },
  ],
  homepage: [
    {
      _type: 'homepage',
      _id: 'mock-homepage-1',
      title: 'Welcome to the Lucidity Demo',
      hero: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
      body: 'Homepage body from Lucidity.\n\n<strong>Second paragraph</strong> with light HTML.',
    },
  ],
}

export function getMockSchemaTypes() {
  return schemaTypes
}

export function getMockContent(type: string) {
  return documentsByType[type] ?? []
}
