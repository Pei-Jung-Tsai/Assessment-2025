<script setup>
import TopNav from './components/TopNav.vue'
</script>

<template>
  <header>
    <TopNav />
  </header>
  <section class="TopPic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>
  <main class="container mt-5">
    <h1>Welcome to my website!</h1>
  </main>
</template>

<style scoped></style>
