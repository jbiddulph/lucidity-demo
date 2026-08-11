<script setup lang="ts">
/**
 * Dynamic Lucidity route — /:slug
 *
 * Handles both:
 *   /blog              → Page (+ Include content loops, e.g. posts)
 *   /first-blog-post   → Post (or any other schema document matched by slug)
 *
 * API: GET /api/lucidity/pages/:slug
 *   → tries Page schema first, then other types via /api/query?type=…
 */
import type { LucidityDocument, LuciditySlugPayload } from '../../types/lucidity'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data: payload, error, pending } = await useAsyncData(
  () => `lucidity-slug-${slug.value}`,
  () => $fetch<LuciditySlugPayload>(`/api/lucidity/pages/${slug.value}`),
  { watch: [slug] },
)

const document = computed(() => payload.value?.document || null)
const kind = computed(() => payload.value?.kind || null)
const included = computed(() => payload.value?.included || [])
const schema = computed(() => payload.value?.schema || null)

const title = computed(() => {
  const doc = document.value
  if (!doc) return slug.value
  for (const key of ['title', 'name', 'headline', 'label', 'slug']) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return slug.value
})

useSeoMeta({
  title: () => `${title.value} · Lucidity`,
})

function itemTitle(doc: LucidityDocument) {
  for (const key of ['title', 'name', 'headline', 'label', 'slug']) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return String(doc._id || 'Untitled')
}

function itemSummary(doc: LucidityDocument) {
  for (const key of ['excerpt', 'bio', 'body', 'description']) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function itemHref(doc: LucidityDocument) {
  const value = doc.slug
  return typeof value === 'string' && value.trim() ? `/${value.trim()}` : null
}

function fieldEntries(doc: LucidityDocument) {
  return Object.entries(doc).filter(([key, value]) => {
    if (key.startsWith('_') || key === 'items') return false
    if (value == null || value === '') return false
    if (key === 'title' || key === 'name' || key === 'slug' || key === 'body') return false
    return true
  })
}

function formatValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <article class="page-view">
    <p v-if="pending" class="muted">Loading…</p>
    <p v-else-if="error" class="error">
      {{ error.message || error.statusMessage || 'Not found' }}
    </p>

    <template v-else-if="document">
      <p class="eyebrow mono">
        {{ document._type || schema?.name || 'content' }}
        <template v-if="kind === 'document'"> · document</template>
        <template v-else> · page</template>
      </p>
      <h1>{{ title }}</h1>
      <p v-if="document.slug" class="slug mono">/{{ document.slug }}</p>

      <!-- Full body for pages and individual posts/documents -->
      <div v-if="document.body" class="body">{{ document.body }}</div>

      <!-- Extra fields on document detail views (author, excerpt, etc.) -->
      <dl v-if="kind === 'document' && fieldEntries(document).length" class="fields">
        <div v-for="[key, value] in fieldEntries(document)" :key="key">
          <dt class="mono">{{ key }}</dt>
          <dd>{{ formatValue(value) }}</dd>
        </div>
      </dl>

      <!--
        Include content loop (Pages only)
        Lucidity Page field: items (type: collection)
        Example on Blog: items = [{ type: "post", relation: "all", items: [...] }]
      -->
      <section
        v-for="collection in included"
        :key="collection.typeName"
        class="collection"
      >
        <header class="collection-head">
          <h2>{{ collection.schema?.title || collection.typeName }}</h2>
          <p class="mono">
            items → {{ collection.typeName }}
            <template v-if="collection.relation"> ({{ collection.relation }})</template>
            · {{ collection.documents.length }} items
          </p>
        </header>

        <div v-if="collection.documents.length" class="collection-grid">
          <article
            v-for="doc in collection.documents"
            :key="String(doc._id || itemTitle(doc))"
            class="card"
          >
            <p class="type mono">{{ doc._type || collection.typeName }}</p>
            <h3>
              <!-- Links to /:slug — resolved as a Post/document, not a Page -->
              <NuxtLink v-if="itemHref(doc)" :to="itemHref(doc)!">
                {{ itemTitle(doc) }}
              </NuxtLink>
              <template v-else>{{ itemTitle(doc) }}</template>
            </h3>
            <p v-if="itemSummary(doc)" class="summary">{{ itemSummary(doc) }}</p>
          </article>
        </div>
        <p v-else class="muted">
          No published <code class="mono">{{ collection.typeName }}</code> documents yet.
        </p>
      </section>

      <p v-if="kind === 'document'" class="back">
        <NuxtLink to="/blog">← Back to Blog</NuxtLink>
      </p>
    </template>
  </article>
</template>

<style scoped>
.page-view {
  width: min(860px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2rem 0 4rem;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
}

h1 {
  margin: 0;
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 400;
  letter-spacing: -0.03em;
}

h2 {
  margin: 0;
  font-size: 1.45rem;
}

h3 {
  margin: 0.2rem 0 0;
  font-size: 1.15rem;
}

h3 a {
  color: var(--accent-deep);
}

.slug {
  margin: 0.5rem 0 0;
  color: var(--ink-muted);
}

.body {
  margin-top: 1.5rem;
  line-height: 1.65;
  white-space: pre-wrap;
  font-size: 1.05rem;
}

.fields {
  margin: 1.5rem 0 0;
  display: grid;
  gap: 0.65rem;
}

.fields > div {
  display: grid;
  grid-template-columns: minmax(7rem, 10rem) 1fr;
  gap: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--line);
}

dt {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.8rem;
}

dd {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.collection {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--line);
}

.collection-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.collection-head .mono {
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.collection-grid {
  display: grid;
  gap: 0.85rem;
}

.card {
  padding: 1rem 1.1rem;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #fff, #f7fbf9);
}

.type {
  margin: 0;
  color: var(--accent);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.summary {
  margin: 0.55rem 0 0;
  color: var(--ink-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.back {
  margin-top: 2rem;
}

.back a {
  color: var(--accent-deep);
  font-weight: 600;
}

.muted,
.error {
  color: var(--ink-muted);
}

.error {
  color: var(--danger);
}

code {
  background: var(--surface-2);
  border-radius: 6px;
  padding: 0.1rem 0.35rem;
}

@media (max-width: 640px) {
  .fields > div {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>
