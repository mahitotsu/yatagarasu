export default defineNuxtRouteMiddleware(async () => {

    const session = useState<{ email: string, active: boolean } | null>('session', () => null);

    if (session.value == null) {
        const { data } = await useFetch('/api/session-data');
        session.value = data?.value;
    }

    if (session.value?.active != true) {
        return await navigateTo('/oauth2/invalidate', { external: true, })
    }
})