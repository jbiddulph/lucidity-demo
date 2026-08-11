// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    lucidity: {
      // e.g. https://lucidity-lac.vercel.app
      baseUrl: process.env.LUCIDITY_BASE_URL || '',
      // API key from Lucidity (luc_…)
      apiKey: process.env.LUCIDITY_API_KEY || process.env.LUCIDITY_TOKEN || '',
    },
    lucidityUseMock: process.env.LUCIDITY_USE_MOCK === 'true',
  },

  app: {
    head: {
      title: 'Lucidity Demo',
      meta: [
        {
          name: 'description',
          content: 'Nuxt demo that discovers Lucidity schema types via the query API, then loads each content dataset',
        },
      ],
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
})
