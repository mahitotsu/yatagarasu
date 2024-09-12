<script setup lang="ts">
import { DecisionStattusOptions } from '~/types';

const statusOptions = Object.keys(DecisionStattusOptions);
const body = ref({ id: useRoute().query.id });
const { data: decision } = await useFetch('/api/decisions/get', { method: 'POST', body });

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
        <NuxtLink :to="{ path: './view', query: { id: decision?.id } }">
            <button :disabled="!decision || !decision.id">View</button>
        </NuxtLink>
        &nbsp;|&nbsp;
        <button :disabled="!decision" @click.prevent="saveDecision">Save</button>
        &nbsp;|&nbsp;
        <button :disabled="!decision || !decision.id" @click.prevent="deleteDecision">Delete</button>
    </div>
    <form v-if="decision">
        <div>
            <label>ID</label>
            <span>{{ decision.id }}</span>
        </div>
        <div>
            <label>Title</label>
            <input type="textbox" v-model="decision.title" />
        </div>
        <div>
            <label>Status</label>
            <select v-model="decision.status">
                <option v-for="(label) in statusOptions" :value="label">{{ label }}</option>
            </select>
        </div>
        <div>
            <lable>context</lable>
            <textarea v-model="decision.context"></textarea>
        </div>
        <div>
            <lable>decision</lable>
            <textarea v-model="decision.decision"></textarea>
        </div>
        <div>
            <lable>consequence</lable>
            <textarea v-model="decision.consequence"></textarea>
        </div>
    </form>
</template>