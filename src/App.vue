<script setup>
import TopNav from './components/TopNav.vue'
</script>

<template>
  <header>
    <TopNav />
    <router-view />
  </header>

  <section class="TopPic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>
</template>

<style scoped></style>
