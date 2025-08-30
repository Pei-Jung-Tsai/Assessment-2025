<script setup>
import TopNav from './components/TopNav.vue'
import RegisterForm from './components/RegisterForm.vue'
import RecipesList from './components/RecipesList.vue'
</script>

<template>
  <header>
    <TopNav />
  </header>

  <section class="TopPic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>
  <main class="container mt-5">
    <RegisterForm />
    <RecipesList />
    <EmployeesList />
  </main>
</template>

<style scoped></style>
