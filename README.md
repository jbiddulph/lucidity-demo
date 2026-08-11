# Lucidity Demo

Nuxt app that discovers Lucidity content types, builds nav from Pages, and can loop another schema on a page.

## Lucidity API contract

| Endpoint | Purpose |
| --- | --- |
| `GET /api/query/schema-types` | List schemas |
| `GET /api/query?type={name}` | Documents for a schema |
| Page documents | Site navigation (`title` + `slug`) |

## Page → included schema loop

Add an optional field on the **Page** schema in Lucidity:

```json
{
  "name": "includeType",
  "type": "string",
  "title": "Include content type",
  "description": "Schema name to list on this page, e.g. post"
}
```

Example:

- Page `Blog` (`slug: blog`) with `includeType: "post"`
- Demo loads `/blog`, then also `GET /api/query?type=post`, and loops posts on that page

Aliases also accepted: `contentType`, `schemaType`, `loopType`, `collection`.

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

Use `LUCIDITY_USE_MOCK=true` to preview Blog → posts locally before the Lucidity field exists.
# lucidity-demo
