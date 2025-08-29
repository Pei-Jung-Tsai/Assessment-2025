<script setup>
import TopNav from './components/TopNav.vue'
import RegisterForm from './components/RegisterForm.vue'
</script>

<template>
  <header>
    <TopNav />
  </header>
  <section class="TopPic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>
  <main class="container mt-5">
    <h1>Welcome!</h1>
    <RegisterForm />
  </main>
</template>

<style scoped></style>
