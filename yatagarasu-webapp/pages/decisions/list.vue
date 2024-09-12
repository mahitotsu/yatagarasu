<script setup lang="ts">
const list = await $fetch('/api/decisions/list', { method: 'POST' });
</script>

<template>
    <div>
        <NuxtLink to="./edit"><button>Create</button></NuxtLink>
    </div>
    <table v-if="list">
        <thead>
            <tr>
                <th></th>
                <th>Title</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="decision in list">
                <td>
                    <NuxtLink :to="{ path: './view', query: { id: decision.id } }"><button>View</button></NuxtLink>
                </td>
                <td>{{ decision.title }}</td>
                <td>{{ decision.status }}</td>
            </tr>
        </tbody>
    </table>
</template>