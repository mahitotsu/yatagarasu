export default defineNuxtRouteMiddleware(async (to) => {
    if (to.path == '/') {
        return await navigateTo('/decisions/list-decisions');
    }
})