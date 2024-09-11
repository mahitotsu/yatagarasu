<script setup lang="ts">

const route = useRoute();
const id = route.query.id;
const { data: decision } = await useFetch('/api/decisions/get', { method: 'POST', body: { id: id } })

</script>

<template>
    <NuxtLink to="./list-decisions">
        <button>List</button>
    </NuxtLink>
    <NuxtLink v-if="decision" :to="{ path: './edit-decision', query: { id: decision.id } }">
        <button>Edit</button>
    </NuxtLink>
    <pre>{{ JSON.stringify(decision, null, 4) }} </pre>
</template>