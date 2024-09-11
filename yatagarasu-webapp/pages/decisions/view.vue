<script setup lang="ts">
const id = useRoute().query.id;
const { data: decision } = await useFetch('/api/decisions/get', { method: 'POST', body: { id } });
</script>

<template>
    <div>
        <NuxtLink to="./list">
            <button>List</button>
        </NuxtLink>
        &nbsp;|&nbsp;
        <NuxtLink :to="{ path: './edit', query: { id: decision?.id } }">
            <button :disabled="!decision">Edit</button>
        </NuxtLink>
    </div>
    <div v-if="decision">
        <pre>{{ JSON.stringify(decision, null, 4) }}</pre>
    </div>
</template>