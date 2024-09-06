<script setup lang="ts">
const session = await useState<{ email: string; }>('session');
</script>
<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <header>
    <nav>
      <ul>
        <li>{{ session?.email }} : <a href="/oauth2/signout">sign-out</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <NuxtPage />
  </main>
</template>
