<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <header>
    <nav>
      <ul>
        <li><a href="/oauth2/signout">sign-out</a></li>
      </ul>
    </nav>
  </header>
  <main>
    <NuxtPage />
  </main>
</template>
