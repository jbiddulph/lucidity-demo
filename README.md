# Lucidity Demo

Nuxt app that discovers Lucidity content types, builds nav from Pages, and loops
**Include content** collections (e.g. posts on the Blog page).

## Lucidity API calls used by this demo

| Call | Purpose |
| --- | --- |
| `GET /api/query/schema-types` | List schemas (author, page, post, …) |
| `GET /api/query?type=page` | Pages → site navigation |
| `GET /api/query?type={name}` | Documents for any schema |
| Page field `items` (type `collection`) | Include other schemas on a page |

### Blog → posts example

Lucidity Page document:

```json
{
  "title": "Blog",
  "slug": "blog",
  "items": [
    {
      "type": "post",
      "relation": "all",
      "items": [ { "title": "First Blog post", "slug": "first-blog-post", ... } ]
    }
  ]
}
```

The demo route `/blog` reads that `items` array and loops each included post.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

```bash
LUCIDITY_BASE_URL=https://lucidity-lac.vercel.app
LUCIDITY_API_KEY=luc_…
LUCIDITY_USE_MOCK=false
```

Open [http://localhost:3000/blog](http://localhost:3000/blog) to see posts listed under the Blog page.
