<script setup lang="ts">
import type { LucidityDemoPayload, LucidityDocument } from '../../types/lucidity'

type StatusPayload = {
  configured: boolean
  useMock: boolean
  baseUrl: string | null
  queryUrl: string | null
  schemaTypesUrl: string | null
}

const { data: status } = await useFetch<StatusPayload>('/api/lucidity/status')
const { data: demo, pending, error, refresh } = await useFetch<LucidityDemoPayload>('/api/lucidity/demo')

const activeType = ref<string>('')

watchEffect(() => {
  const first = demo.value?.types?.[0]?.type.name
  if (!activeType.value && first) {
    activeType.value = first
  }
  if (
    activeType.value
    && demo.value?.types?.length
    && !demo.value.types.some((bucket) => bucket.type.name === activeType.value)
  ) {
    activeType.value = first || ''
  }
})

const activeBucket = computed(() =>
  demo.value?.types?.find((bucket) => bucket.type.name === activeType.value) || null,
)

function documentTitle(doc: LucidityDocument) {
  for (const key of ['title', 'name', 'headline', 'label', 'slug']) {
    const value = doc[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return String(doc._id || 'Untitled')
}

function documentFields(doc: LucidityDocument) {
  return Object.entries(doc).filter(([key, value]) => {
    if (key.startsWith('_')) return false
    if (value == null || value === '') return false
    if (typeof value === 'object') return true
    return true
  })
}

function formatValue(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value, null, 2)
}

function formatDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <div class="brand-mark" aria-hidden="true" />
      <div class="hero-copy">
        <p class="eyebrow">Lucidity CMS</p>
        <h1>Schema-driven content demo</h1>
        <p class="lede">
          Content types come from
          <code class="mono">GET /api/query/schema-types</code>.
          If a Page schema exists, those documents become the site navigation.
        </p>
      </div>
      <div class="hero-actions">
        <button class="btn" type="button" :disabled="pending" @click="() => refresh()">
          {{ pending ? 'Refreshing…' : 'Refresh' }}
        </button>
        <a
          v-if="status?.baseUrl"
          class="btn ghost"
          :href="status.baseUrl"
          target="_blank"
          rel="noreferrer"
        >
          Open Lucidity
        </a>
      </div>
    </header>

    <section class="status-strip" aria-label="Connection status">
      <div class="pill" :data-tone="status?.useMock ? 'warn' : 'ok'">
        {{ status?.useMock ? 'Mock fixtures' : 'Live Lucidity API' }}
      </div>
      <div class="meta">
        <span class="mono">{{ status?.schemaTypesUrl || 'No schema-types URL' }}</span>
        <span class="mono">{{ status?.queryUrl || 'No query URL' }}</span>
        <span v-if="demo?.fetchedAt">Fetched {{ formatDate(demo.fetchedAt) }}</span>
      </div>
    </section>

    <section v-if="!status?.configured" class="setup">
      <h2>Connect Lucidity</h2>
      <pre class="mono">LUCIDITY_BASE_URL=https://lucidity-lac.vercel.app
LUCIDITY_API_KEY=luc_…
LUCIDITY_USE_MOCK=false</pre>
    </section>

    <p v-if="error" class="error">
      Failed to load Lucidity content:
      {{ error.message || error.statusMessage || 'Unknown error' }}
    </p>

    <section v-if="demo?.navigation?.length" class="nav-preview">
      <h2>Site navigation from Pages</h2>
      <p>
        Built from schema
        <code class="mono">{{ demo.pageSchemaName }}</code>
        via <code class="mono">/api/query?type={{ demo.pageSchemaName }}</code>.
        Optional page field <code class="mono">includeType</code> pulls another schema into that page (e.g. Blog → post).
      </p>
      <ul>
        <li v-for="item in demo.navigation" :key="item.id">
          <NuxtLink :to="item.path">{{ item.title }}</NuxtLink>
          <span class="mono">{{ item.path }}</span>
        </li>
      </ul>
    </section>

    <section v-if="demo?.note" class="note">
      <h2>No schema types published for this API key</h2>
      <p>{{ demo.note }}</p>
      <p>
        Content datasets can be named anything in Lucidity. This demo will only show tabs for
        types returned by the schema catalog query.
      </p>
    </section>

    <section v-if="demo?.types?.length" class="summary">
      <article v-for="bucket in demo.types" :key="bucket.type.id">
        <p class="label">{{ bucket.type.title }}</p>
        <p class="value">{{ bucket.documents.length }}</p>
        <p class="hint mono">{{ bucket.type.name }}</p>
      </article>
    </section>

    <section v-if="demo?.types?.length" class="panel">
      <div class="tabs" role="tablist">
        <button
          v-for="bucket in demo.types"
          :key="bucket.type.id"
          type="button"
          role="tab"
          class="tab"
          :aria-selected="activeType === bucket.type.name"
          :data-active="activeType === bucket.type.name"
          @click="activeType = bucket.type.name"
        >
          {{ bucket.type.title }}
          <span>{{ bucket.documents.length }}</span>
        </button>
      </div>

      <div v-if="activeBucket" class="cards">
        <p v-if="activeBucket.type.description" class="type-desc">
          {{ activeBucket.type.description }}
        </p>

        <article
          v-for="doc in activeBucket.documents"
          :key="String(doc._id || documentTitle(doc))"
          class="card"
        >
          <p class="type mono">{{ doc._type || activeBucket.type.name }}</p>
          <h2>{{ documentTitle(doc) }}</h2>
          <dl class="fields">
            <div v-for="[key, value] in documentFields(doc)" :key="key">
              <dt class="mono">{{ key }}</dt>
              <dd>{{ formatValue(value) }}</dd>
            </div>
          </dl>
          <footer v-if="doc._publishedAt">
            <span>{{ formatDate(String(doc._publishedAt)) }}</span>
          </footer>
        </article>

        <p v-if="!activeBucket.documents.length" class="empty">
          Schema type <code class="mono">{{ activeBucket.type.name }}</code> has no published documents.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  width: min(1080px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 2.5rem 0 4rem;
  display: grid;
  gap: 1.25rem;
}

.hero {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1.25rem;
  align-items: end;
  padding: 1.75rem;
  border-radius: var(--radius);
  background:
    linear-gradient(135deg, rgba(15, 118, 110, 0.92), rgba(11, 45, 40, 0.96)),
    var(--bg);
  color: #f4fffb;
  box-shadow: var(--shadow);
}

.brand-mark {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.25), transparent 55%),
    repeating-linear-gradient(
      -18deg,
      rgba(255, 255, 255, 0.12) 0 2px,
      transparent 2px 8px
    ),
    #0b4f49;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.eyebrow {
  margin: 0 0 0.35rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
}

h1 {
  margin: 0;
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 400;
  letter-spacing: -0.03em;
}

h2 {
  margin: 0;
  font-size: 1.35rem;
  letter-spacing: -0.02em;
}

.lede {
  margin: 0.65rem 0 0;
  max-width: 42rem;
  color: rgba(244, 255, 251, 0.82);
  line-height: 1.5;
}

.lede code {
  color: #dff8ee;
}

.hero-actions {
  display: flex;
  gap: 0.65rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  appearance: none;
  border: 0;
  border-radius: 999px;
  padding: 0.7rem 1.1rem;
  background: #edf8f4;
  color: var(--accent-deep);
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.65;
  cursor: wait;
}

.btn.ghost {
  background: transparent;
  color: #edf8f4;
  border: 1px solid rgba(237, 248, 244, 0.35);
}

.status-strip,
.setup,
.summary,
.panel,
.error,
.note,
.nav-preview {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(201, 215, 209, 0.9);
  border-radius: var(--radius);
  backdrop-filter: blur(8px);
}

.status-strip {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 0.9rem 1.1rem;
}

.pill {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
}

.pill[data-tone='ok'] {
  background: #d9f2e4;
  color: var(--ok);
}

.pill[data-tone='warn'] {
  background: #fff1cc;
  color: var(--warn);
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  color: var(--ink-muted);
  font-size: 0.92rem;
}

.setup,
.error,
.note,
.nav-preview {
  padding: 1.25rem 1.35rem;
}

.nav-preview h2 {
  margin-bottom: 0.35rem;
}

.nav-preview p {
  margin: 0;
  color: var(--ink-muted);
}

.nav-preview ul {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
}

.nav-preview li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 0.7rem 0.85rem;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #fff;
}

.nav-preview a {
  font-weight: 600;
  color: var(--accent-deep);
}

.nav-preview .mono {
  color: var(--ink-muted);
  font-size: 0.85rem;
}

.setup pre,
.setup code,
.note code,
.empty code {
  background: var(--surface-2);
  border-radius: 8px;
}

.setup code,
.note code,
.empty code {
  padding: 0.1rem 0.35rem;
}

.setup pre {
  margin: 0.85rem 0 0;
  padding: 1rem;
  overflow: auto;
  font-size: 0.85rem;
  line-height: 1.5;
}

.note p {
  color: var(--ink-muted);
  line-height: 1.5;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
}

.summary article {
  padding: 0.9rem 1rem;
  border-radius: 14px;
  background: linear-gradient(180deg, #fff, var(--surface));
  border: 1px solid var(--line);
}

.label {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.value {
  margin: 0.35rem 0 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.hint {
  margin: 0.25rem 0 0;
  color: var(--ink-muted);
  font-size: 0.8rem;
}

.panel {
  overflow: hidden;
}

.tabs {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.75rem;
  border-bottom: 1px solid var(--line);
}

.tab {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  border-radius: 999px;
  padding: 0.55rem 0.9rem;
  cursor: pointer;
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  white-space: nowrap;
}

.tab span {
  font-family: var(--mono);
  font-size: 0.78rem;
  background: var(--surface-2);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
}

.tab[data-active='true'] {
  background: var(--accent-soft);
  color: var(--accent-deep);
  font-weight: 600;
}

.cards {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.type-desc {
  margin: 0;
  color: var(--ink-muted);
}

.card {
  padding: 1.15rem 1.2rem;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, #fff, #f7fbf9);
}

.type {
  margin: 0 0 0.35rem;
  color: var(--accent);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.fields {
  margin: 0.85rem 0 0;
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

.card footer {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--line);
  color: var(--ink-muted);
  font-size: 0.88rem;
}

.empty {
  margin: 0;
  color: var(--ink-muted);
}

.error {
  color: var(--danger);
  border-color: #f3c1bc;
  background: #fff5f4;
}

@media (max-width: 840px) {
  .hero {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .fields > div {
    grid-template-columns: 1fr;
    gap: 0.2rem;
  }
}
</style>
