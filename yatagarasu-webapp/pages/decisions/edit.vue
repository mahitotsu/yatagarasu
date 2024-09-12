<script setup lang="ts">
const body = ref({ id: useRoute().query.id });
const { data: decision } = await useFetch('/api/decisions/get', { method: 'POST', body, watch: [body] });

const saveDecision = async () => {
    $fetch('/api/decisions/save', { method: 'POST', body: JSON.stringify(decision.value) })
        .then(saved => body.value.id = saved.id)
}
const deleteDecision = async () => {
    $fetch('/api/decisions/delete', { method: 'POST', body: JSON.stringify({ id: body.value.id }) })
        .then(() => useRouter().push('./list'));
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
        <button :disabled="!decision || !decision.id" @click.prevent="deleteDecision">Delete</button>
    </div>
    <div v-if="decision">
        <pre>{{ JSON.stringify(decision, null, 4) }}</pre>
    </div>
</template>