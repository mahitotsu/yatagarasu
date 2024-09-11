<script setup lang="ts">
const { data: decision } = await useFetch('/api/decisions/create', { method: 'POST' });

const saveDecision = async () => {
    useFetch('/api/decisions/save', { method: 'POST', body: decision.value })
        .then(r => useRouter().push({ path: './edit', query: { id: decision.value!.id } }));
}
</script>

<template>
    <div>
        <NuxtLink to="./list">
            <button>List</button>
        </NuxtLink>
        &nbsp;|&nbsp;
        <button :disabled="!decision" @click.prevent="saveDecision">Save</button>
    </div>
    <div v-if="decision">
        <pre>{{ JSON.stringify(decision, null, 4) }}</pre>
    </div>
</template>