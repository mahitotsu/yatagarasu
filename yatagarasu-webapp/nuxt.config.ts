export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  nitro: {
    preset: 'aws-lambda',
    serveStatic: false,
    minify: true,
    inlineDynamicImports: true,
    externals: {
      inline: ['@aws-sdk', '@aws-lambda-powertoos']
    }
  },
  runtimeConfig: {
    authDomain: '',
    secretName: '',
  }
});
