<script setup lang="ts">
const { data } = await useFetch('/api/session-data');
</script>
<template>
    <h1>Hello World</h1>
    <p>This is an index page. Wellcom, {{ data!.email }} .</p>
</template>