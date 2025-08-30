<script setup>
import recipes from '../assets/json/recipes.json'
</script>

<template>
  <section class="container mt-4">
    <h2>Recipes</h2>
    <ul>
      <li v-for="item in recipes" :key="item.id">
        <strong>{{ item.title }}</strong> - {{ item.category }} ({{ item.time }} min)
      </li>
    </ul>
  </section>
</template>
