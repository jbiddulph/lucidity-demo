<script setup lang="ts">
import type { LucidityDocument, LucidityPagePayload } from '../../types/lucidity'

const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data: payload, error, pending } = await useAsyncData(
  () => `lucidity-page-${slug.value}`,
  () => $fetch<LucidityPagePayload>(`/api/lucidity/pages/${slug.value}`),
  { watch: [slug] },
)

const page = computed(() => payload.value?.page || null)
const included = computed(() => payload.value?.included || null)

const title = computed(() => {
  const value = page.value?.title || page.value?.name || slug.value
  return typeof value === 'string' ? value : slug.value
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
</script>

<template>
  <article class="page-view">
    <p v-if="pending" class="muted">Loading page…</p>
    <p v-else-if="error" class="error">
      {{ error.message || error.statusMessage || 'Page not found' }}
    </p>
    <template v-else-if="page">
      <p class="eyebrow mono">{{ page._type || 'page' }}</p>
      <h1>{{ title }}</h1>
      <p v-if="page.slug" class="slug mono">/{{ page.slug }}</p>
      <div v-if="page.body" class="body">{{ page.body }}</div>

      <section v-if="included" class="collection">
        <header class="collection-head">
          <h2>{{ included.schema?.title || included.typeName }}</h2>
          <p class="mono">
            includeType={{ included.typeName }} · {{ included.documents.length }} items
          </p>
        </header>

        <div v-if="included.documents.length" class="collection-grid">
          <article
            v-for="doc in included.documents"
            :key="String(doc._id || itemTitle(doc))"
            class="card"
          >
            <p class="type mono">{{ doc._type || included.typeName }}</p>
            <h3>
              <NuxtLink v-if="itemHref(doc)" :to="itemHref(doc)!">
                {{ itemTitle(doc) }}
              </NuxtLink>
              <template v-else>{{ itemTitle(doc) }}</template>
            </h3>
            <p v-if="itemSummary(doc)" class="summary">{{ itemSummary(doc) }}</p>
          </article>
        </div>
        <p v-else class="muted">
          No published <code class="mono">{{ included.typeName }}</code> documents yet.
        </p>
      </section>
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
</style>
