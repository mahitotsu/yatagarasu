<script setup lang="ts">
const id = useRoute().query.id;
const { data: decision, refresh } = await useFetch('/api/decisions/get', { method: 'POST', body: { id } });

const saveDecision = async () => {
    useFetch('/api/decisions/save', { method: 'POST', body: decision.value })
        .then(r => refresh());
}
const deleteDecision = async () => {
    useFetch('/api/decisions/delete', { method: 'POST', body: { id } })
        .then(r => decision.value = null)
        .then(r => useRouter().push('./list'));
}
</script>

<template>
    <div>
        <NuxtLink to="./list">
            <button>List</button>
        </NuxtLink>
        &nbsp;|&nbsp;
        <button :disabled="!decision" @click.prevent="saveDecision">Save</button>
        &nbsp;|&nbsp;
        <button :disabled="!decision" @click.prevent="deleteDecision">Delete</button>
    </div>
    <div v-if="decision">
        <pre>{{ JSON.stringify(decision, null, 4) }}</pre>
    </div>
</template>