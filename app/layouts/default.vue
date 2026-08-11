<script setup lang="ts">
/**
 * Default layout — site chrome shared by all pages.
 *
 * Navigation is driven by Lucidity Pages:
 *   GET /api/lucidity/navigation
 *     → GET {LUCIDITY}/api/query/schema-types
 *     → GET {LUCIDITY}/api/query?type=page
 * Each page becomes a header link using its title + slug.
 */
import type { LucidityNavItem } from '../../types/lucidity'

const { data: navigation } = await useFetch<LucidityNavItem[]>('/api/lucidity/navigation')
</script>

<template>
  <div class="shell">
    <header class="site-header">
      <NuxtLink to="/" class="logo">Lucidity</NuxtLink>
      <nav v-if="navigation?.length" aria-label="Site">
        <!-- Loop Lucidity Page documents as site nav -->
        <NuxtLink
          v-for="item in navigation"
          :key="item.id"
          :to="item.path"
          class="nav-link"
        >
          {{ item.title }}
        </NuxtLink>
      </nav>
      <p v-else class="nav-empty">
        No Page schema / pages yet
      </p>
    </header>
    <slot />
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
}

.site-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  width: min(1080px, calc(100% - 2rem));
  margin: 0 auto;
  padding: 1.25rem 0 0.25rem;
}

.logo {
  font-family: 'Instrument Serif', Georgia, serif;
  font-size: 1.6rem;
  letter-spacing: -0.03em;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.85rem;
}

.nav-link {
  color: var(--ink-muted);
  font-weight: 500;
  padding: 0.35rem 0.55rem;
  border-radius: 999px;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--accent-deep);
  background: var(--accent-soft);
}

.nav-empty {
  margin: 0;
  color: var(--ink-muted);
  font-size: 0.9rem;
}
</style>
