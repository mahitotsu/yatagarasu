// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },

  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
        format: 'esm',
      }
    }
  },

  modules: ['nuxt-security']
})