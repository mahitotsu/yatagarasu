export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  nitro: {
    preset: 'aws-lambda',
    serveStatic: false,
    inlineDynamicImports: true,
    esbuild: {
      options: {
        target: 'esnext'
      }
    }
  },
  runtimeConfig: {
    sessionPassword: Array.from({ length: 64 }, () => Math.random().toString(36)[2]).join(''),
  }
});
