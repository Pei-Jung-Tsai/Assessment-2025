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
import { ref } from 'vue'
import db from '../../firebase/init.js'
import { collection, addDoc } from 'firebase/firestore'

export default {
  setup() {
    const title = ref('')
    const category = ref('')
    const time = ref('')
    const image = ref('')
    const ingredientsInput = ref('')
    const stepsInput = ref('')

    const addRecipe = async () => {
      try {
        await addDoc(collection(db, 'recipes'), {
          title: title.value,
          category: category.value,
          time: Number(time.value),
          image: image.value,
          ingredients: ingredientsInput.value.split(',').map((i) => i.trim()),
          steps: stepsInput.value.split(',').map((s) => s.trim()),
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
