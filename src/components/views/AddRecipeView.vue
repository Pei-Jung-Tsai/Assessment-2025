<template>
  <div>
    <h1>Add Recipe</h1>
    <form @submit.prevent="addRecipe">
      <div>
        <label for="title">Title:</label>
        <input type="text" v-model="title" id="title" required />
      </div>

      <div>
        <label for="category">Category:</label>
        <input type="text" v-model="category" id="category" required />
      </div>

      <div>
        <label for="time">Time (minutes):</label>
        <input type="number" v-model="time" id="time" required />
      </div>

      <div>
        <label for="image">Image URL:</label>
        <input type="text" v-model="image" id="image" />
      </div>

      <div>
        <label for="ingredients">Ingredients (comma separated):</label>
        <input type="text" v-model="ingredientsInput" id="ingredients" />
      </div>

      <div>
        <label for="steps">Steps (comma separated):</label>
        <input type="text" v-model="stepsInput" id="steps" />
      </div>

      <button type="submit">Add Recipe</button>
    </form>
  </div>
</template>

<script>
import { clampText, isSafeHttpsUrl, toPositiveInt } from '@/utils/validate'
import { ref } from 'vue'
import db from '../../firebase/init.js'
import { authState } from '../../stores/auth'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export default {
  setup() {
    const title = ref('')
    const category = ref('')
    const time = ref('')
    const image = ref('')
    const ingredientsInput = ref('')
    const stepsInput = ref('')

    const addRecipe = async () => {
      const uid = authState.uid
      try {
        await addDoc(collection(db, 'recipes'), {
          title: clampText(title.value, 80),
          category: clampText(category.value, 40),
          time: toPositiveInt(time.value, 1, 600),
          image: isSafeHttpsUrl(image.value) ? image.value : '',
          ingredients: clampText(ingredientsInput.value, 500)
            .split(',')
            .map((s) => clampText(s, 40))
            .filter(Boolean),
          steps: clampText(stepsInput.value, 1000)
            .split(',')
            .map((s) => clampText(s, 100))
            .filter(Boolean),
          // Aggregates for average rating
          ratingCount: 0,
          ratingSum: 0,
          avgRating: 0,

          createdAt: serverTimestamp(),
          createdBy: uid,
        })

        // reset form
        title.value = ''
        category.value = ''
        time.value = ''
        image.value = ''
        ingredientsInput.value = ''
        stepsInput.value = ''

        alert('Recipe added successfully!')
      } catch (error) {
        console.error('Error adding recipe: ', error)
      }
    }

    return {
      title,
      category,
      time,
      image,
      ingredientsInput,
      stepsInput,
      addRecipe,
    }
  },
}
</script>
