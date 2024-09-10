<template>
    <table>
        <tr>
            <th>title</th>
            <th>status</th>
            <th>created</th>
            <th>modified</th>
        </tr>
        <tr v-for="decision in decisions">
            <td>{{ decision.title }}</td>
            <td>{{ decision.status}}</td>
            <td>{{ decision.created}}</td>
            <td>{{ decision.modified}}</td>
        </tr>
    </table>
</template>
<script setup lang="ts">
const { data: decisions } = useFetch('/api/decisions/list', { method: 'POST' })
</script>