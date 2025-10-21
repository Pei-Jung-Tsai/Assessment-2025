<template>
  <!--  Named section for screen readers via aria-labelledby -->
  <section aria-labelledby="add-recipe-heading">
    <h1 id="add-recipe-heading">Add Recipe</h1>

    <!--  Form with explicit labels, helper texts, and required attributes -->
    <form @submit.prevent="addRecipe" novalidate>
      <div>
        <!-- Label ties to input by id; screen readers announce label first -->
        <label for="title">Title</label>
        <input
          id="title"
          type="text"
          v-model="title"
          required
          aria-required="true"
          autocomplete="off"
          aria-describedby="title-hint"
        />
        <!-- Helper text connected via aria-describedby -->
        <small id="title-hint" class="text-muted">Give your recipe a short, clear name.</small>
      </div>

      <div>
        <label for="category">Category</label>
        <input
          id="category"
          type="text"
          v-model="category"
          required
          aria-required="true"
          autocomplete="off"
          aria-describedby="category-hint"
        />
        <small id="category-hint" class="text-muted">e.g., Breakfast, Salad, Dinner.</small>
      </div>

      <div>
        <label for="time">Time (minutes)</label>
        <input
          id="time"
          type="number"
          v-model="time"
          required
          aria-required="true"
          inputmode="numeric"
          min="1"
          aria-describedby="time-hint"
        />
        <small id="time-hint" class="text-muted">Enter total cook time in minutes.</small>
      </div>

      <div>
        <label for="image">Image URL</label>
        <input
          id="image"
          type="url"
          v-model="image"
          inputmode="url"
          autocomplete="off"
          aria-describedby="image-hint"
        />
        <small id="image-hint" class="text-muted"
          >Optional. Paste a full https:// image link.</small
        >
      </div>

      <div>
        <label for="ingredients">Ingredients (comma separated)</label>
        <input
          id="ingredients"
          type="text"
          v-model="ingredientsInput"
          autocomplete="off"
          aria-describedby="ingredients-hint"
        />
        <small id="ingredients-hint" class="text-muted">Example: egg, spinach, olive oil.</small>
      </div>

      <div>
        <label for="steps">Steps (comma separated)</label>
        <input
          id="steps"
          type="text"
          v-model="stepsInput"
          autocomplete="off"
          aria-describedby="steps-hint"
        />
        <small id="steps-hint" class="text-muted"
          >Example: preheat oven, mix ingredients, bake.</small
        >
      </div>

      <!-- Buttons are naturally keyboard-accessible (Tab/Enter/Space) -->
      <button type="submit">Add Recipe</button>
    </form>
  </section>

  <!--  Data table section named for assistive tech -->
  <section style="margin-top: 2rem" aria-labelledby="all-recipes-heading">
    <h2 id="all-recipes-heading">All Recipes</h2>

    <!-- PrimeVue DataTable
         DataTable is already accessible; we add semantics and better image alt text. -->
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
      aria-label="Recipes data table"
    >
      <Column header="Image">
        <template #body="{ data }">
          <img
            v-if="data.image"
            :src="data.image"
            :alt="data.title ? `Image of recipe: ${data.title}` : 'Recipe image'"
            style="width: 56px; height: 40px; object-fit: cover; border-radius: 6px"
          />
        </template>
      </Column>
      <Column field="title" header="Title" sortable>
        <template #filter>
          <InputText
            v-model="filters.title.value"
            placeholder="Search title"
            aria-label="Filter by title"
          />
        </template>
      </Column>
      <Column field="category" header="Category" sortable>
        <template #filter>
          <InputText
            v-model="filters.category.value"
            placeholder="Search category"
            aria-label="Filter by category"
          />
        </template>
      </Column>
      <Column field="time" header="Time (mins)" sortable dataType="numeric">
        <template #filter>
          <InputText
            v-model="filters.time.value"
            placeholder="e.g. 30"
            aria-label="Filter by time (minutes)"
          />
        </template>
      </Column>
      <Column field="avgRating" header="Avg ★" sortable dataType="numeric">
        <template #body="{ data }">{{ fmtAvg(data.avgRating) }}</template>
        <template #filter>
          <InputText
            v-model="filters.avgRating.value"
            placeholder="e.g. 3.5"
            aria-label="Filter by average rating"
          />
        </template>
      </Column>
      <Column field="ratingCount" header="# Ratings" sortable dataType="numeric">
        <template #filter>
          <InputText
            v-model="filters.ratingCount.value"
            placeholder="e.g. 5"
            aria-label="Filter by rating count"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Empty state should be announced when it appears -->
    <div v-if="recipes.length === 0" class="text-muted" role="status" aria-live="polite">
      No recipes yet.
    </div>
  </section>
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
