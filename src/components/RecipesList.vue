<script setup>
import { ref, onMounted } from 'vue'

const recipes = ref([])
const error = ref(null)

onMounted(async () => {
  try {
    const respondObject = await fetch('/recipes.json')
    const content = await respondObject.json()
    recipes.value = content
  } catch (error) {
    error.value = 'Failed to load recipes.'
  }
})
</script>

<template>
  <section class="container mt-4">
    <h2>Recipes</h2>

    <p v-if="error" class="text-danger">{{ error }}</p>

    <div v-else class="row g-4">
      <div v-for="r in recipes" :key="r.id" class="col-12 col-md-6 col-lg-4">
        <div class="card-body">
          <h5 class="card-title">{{ r.title }}</h5>
          <p class="card-text">
            Category: {{ r.category }} <br />
            Time: {{ r.time }} mins
          </p>
          <p class="small text-muted">Ingredients: {{ r.ingredients.join(', ') }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
