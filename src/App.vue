<script setup>
import TopNav from './components/TopNav.vue'
</script>

<template>
  <header>
    <TopNav />
  </header>

  <section class="top-pic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>

  <main class="container py-4">
    <router-view />
  </main>
</template>

<style scoped></style>
