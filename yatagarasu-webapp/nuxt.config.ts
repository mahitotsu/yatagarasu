export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  ssr: true,

  nitro: {
    preset: 'aws-lambda',
    serveStatic: false,
    minify: true,
    inlineDynamicImports: true,
    esbuild: {
      options: {
        format: 'esm',
        target: 'es2020',
        platform: 'node',
      },
    },
    externals: {
      inline: ['@aws-sdk/*']
    }
  },

  modules: ['nuxt-security']
})