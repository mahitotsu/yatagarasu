<script setup lang="ts">
const { data: decisions } = useFetch('/api/decisions/list', { method: 'POST' })
</script>
<template>
    <h1>List of decisions</h1>
    <NuxtLink :to="{ path: './edit-decision' }">
        <button>create</button>
    </NuxtLink>
    <table>
        <thead>
            <tr>
                <th>actions</th>
                <th>title</th>
                <th>status</th>
                <th>created</th>
                <th>modified</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="decision in decisions">
                <td>
                    <NuxtLink :to="{ path: './edit-decision', query: { id: decision.id } }">edit</NuxtLink>
                    &nbsp;|&nbsp;
                    <NuxtLink :to="{ path: './view-decision', query: { id: decision.id } }">view</NuxtLink>
                </td>
                <td>{{ decision.title }}</td>
                <td>{{ decision.status }}</td>
                <td>{{ decision.created }}</td>
                <td>{{ decision.modified }}</td>
            </tr>
        </tbody>
    </table>
</template>