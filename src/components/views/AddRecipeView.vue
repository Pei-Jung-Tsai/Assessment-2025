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

    <section style="margin-top: 2rem">
      <h2>All Recipes</h2>
      <DataTable
        :value="recipes"
        v-model:filters="filters"
        paginator
        :rows="10"
        removableSort
        filterDisplay="menu"
        showGridlines
        stripedRows
        class="mb-4"
        responsiveLayout="scroll"
      >
        <Column header="Image">
          <template #body="{ data }">
            <img
              v-if="data.image"
              :src="data.image"
              alt=""
              style="width: 56px; height: 40px; object-fit: cover; border-radius: 6px"
            />
          </template>
        </Column>
        <Column field="title" header="Title" sortable>
          <template #filter>
            <InputText v-model="filters.title.value" placeholder="Search title" />
          </template>
        </Column>
        <Column field="category" header="Category" sortable>
          <template #filter>
            <InputText v-model="filters.category.value" placeholder="Search category" />
          </template>
        </Column>
        <Column field="time" header="Time (mins)" sortable dataType="numeric">
          <template #filter>
            <InputText v-model="filters.time.value" placeholder="e.g. 30" />
          </template>
        </Column>
        <Column field="avgRating" header="Avg ★" sortable dataType="numeric">
          <template #body="{ data }">{{ fmtAvg(data.avgRating) }}</template>
          <template #filter>
            <InputText v-model="filters.avgRating.value" placeholder="e.g. 3.5" />
          </template>
        </Column>
        <Column field="ratingCount" header="# Ratings" sortable dataType="numeric">
          <template #filter>
            <InputText v-model="filters.ratingCount.value" placeholder="e.g. 5" />
          </template>
        </Column>
      </DataTable>

      <div v-if="recipes.length === 0" class="text-muted">No recipes yet.</div>
    </section>
  </div>
</template>

<script>
import { clampText, isSafeHttpsUrl, toPositiveInt } from '@/utils/validate'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import db from '../../firebase/init.js'
import { authState } from '../../stores/auth'
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'

export default {
  components: {
    DataTable,
    Column,
    InputText,
  },
  setup() {
    const title = ref('')
    const category = ref('')
    const time = ref('')
    const image = ref('')
    const ingredientsInput = ref('')
    const stepsInput = ref('')

    const recipes = ref([])

    // Define filters for each DataTable column
    // "CONTAINS" means a simple substring match (like typing part of a word)
    const filters = ref({
      title: { value: null, matchMode: FilterMatchMode.CONTAINS },
      category: { value: null, matchMode: FilterMatchMode.CONTAINS },
      time: { value: null, matchMode: FilterMatchMode.CONTAINS },
      avgRating: { value: null, matchMode: FilterMatchMode.CONTAINS },
      ratingCount: { value: null, matchMode: FilterMatchMode.CONTAINS },
    })

    // Start a real-time listener on the "recipes" collection
    // Whenever the data changes in Firestore, this runs again automatically
    let unsubscribe = null
    onMounted(() => {
      const recipesQuery = query(collection(db, 'recipes'), orderBy('title'))
      unsubscribe = onSnapshot(
        recipesQuery,
        // Convert Firestore documents into JS objects
        // and update the reactive "recipes" array
        (snap) => {
          recipes.value = snap.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
        },
        (err) => console.error('onSnapshot(recipes) error:', err),
      )
    })
    // Stop the listener when the component is destroyed
    onBeforeUnmount(() => {
      if (typeof unsubscribe === 'function') unsubscribe()
    })

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
    function fmtAvg(v) {
      const n = Number(v || 0)
      return Number.isFinite(n) ? n.toFixed(1) : '0.0'
    }

    return {
      title,
      category,
      time,
      image,
      ingredientsInput,
      stepsInput,
      addRecipe,

      recipes,
      filters,
      fmtAvg,
    }
  },
}
</script>
