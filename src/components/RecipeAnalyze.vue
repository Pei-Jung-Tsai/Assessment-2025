<template>
  <section class="card">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h5 class="mb-0">Average Rating by Category</h5>

        <!-- Toggle buttons: switch dataset shown in the single chart -->
        <div class="btn-group btn-group-sm">
          <button
            class="btn"
            :class="currentView === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="switchView('all')"
          >
            All
          </button>
          <button
            class="btn"
            :class="currentView === 'male' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="switchView('male')"
          >
            Male
          </button>
          <button
            class="btn"
            :class="currentView === 'female' ? 'btn-primary' : 'btn-outline-secondary'"
            @click="switchView('female')"
          >
            Female
          </button>
        </div>
      </div>

      <!-- Quick legend for how each view is calculated -->
      <p class="text-muted small mb-3">
        All = weighted by recipe rating counts. Male/Female = per-user average within each category.
      </p>

      <!-- Simple loading state while Firestore reads happen -->
      <div v-if="loading" class="text-muted small">Loading chart...</div>

      <!-- One single Chart component; we only replace its data object on toggle -->
      <Chart
        v-else
        type="bar"
        :data="chartData"
        :options="chartOptions"
        style="max-height: 460px"
      />
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'primevue/chart'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import db from '@/firebase/init.js'

// ----- Reactive state for UI and chart -----
const loading = ref(true) // true until Firestore queries finish
const currentView = ref('all') // which dataset to show: 'all' | 'male' | 'female'

// Chart.js data model: labels + one dataset (we swap dataset values on toggle)
const chartData = ref({
  labels: [],
  datasets: [{ label: 'Avg ★ by Category (All)', data: [] }],
})

// Basic Chart.js options: fixed Y range 0..5, show tooltip/legend
const chartOptions = ref({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      suggestedMax: 5,
      ticks: { stepSize: 1 },
      title: { display: true, text: 'Average rating (0-5)' },
    },
    x: { ticks: { autoSkip: false }, title: { display: true, text: 'Category' } },
  },
  plugins: { legend: { display: true }, tooltip: { enabled: true } },
})

// -------------------- Helpers --------------------
// Normalize a category label for display (empty -> 'Uncategorized')
function normCategory(s) {
  return String(s || 'Uncategorized').trim()
}
// Create a stable, case-insensitive key for grouping (avoid 'Breakfast' vs 'breakfast')
function toKey(s) {
  return normCategory(s).toLowerCase()
}

// These three arrays share the same labels order.
// 'allValues' = weighted by ratingCount using recipe aggregates.
// 'maleValues' / 'femaleValues' = plain average of individual ratings grouped by gender.
let labelsRef = [] // final, ordered category labels for the chart
let allValues = [] // dataset for "All"
let maleValues = [] // dataset for "Male"
let femaleValues = [] // dataset for "Female"

// Replace chartData with the chosen dataset, keeping labels fixed
function setChartFor(view) {
  let data, label
  if (view === 'male') {
    data = maleValues
    label = 'Avg ★ by Category (Male)'
  } else if (view === 'female') {
    data = femaleValues
    label = 'Avg ★ by Category (Female)'
  } else {
    data = allValues
    label = 'Avg ★ by Category (All)'
  }

  chartData.value = {
    labels: labelsRef,
    datasets: [{ label, data }],
  }
}

// Update current view and refresh the dataset shown
function switchView(view) {
  currentView.value = view
  setChartFor(view)
}

// -------------------- Load & aggregate --------------------
onMounted(async () => {
  try {
    // 1) Read all recipes: compute "All" view using weighted average
    //    Weighted by ratingCount: sum(avgRating * ratingCount) / sum(ratingCount)
    const recipesSnap = await getDocs(collection(db, 'recipes'))

    // Accumulators for "All" (by category key)
    const bucketsAll = new Map() // key -> { label, sumWeighted, sumCount }
    const recipeRows = [] // keep {id, catKey, catLabel} for later ratings fetch

    recipesSnap.forEach((d) => {
      const r = d.data() || {}
      const catLabel = normCategory(r.category) // human label (preserve case)
      const key = toKey(catLabel) // grouping key (lowercased)
      const avg = Number(r.avgRating || 0)
      const cnt = Number(r.ratingCount || 0)

      // Init bucket if this category hasn't been seen
      if (!bucketsAll.has(key))
        bucketsAll.set(key, { label: catLabel, sumWeighted: 0, sumCount: 0 })

      // Weighted sum and total count
      const b = bucketsAll.get(key)
      b.sumWeighted += avg * cnt
      b.sumCount += cnt

      // Save for step 2 (reading ratings subcollection per recipe)
      recipeRows.push({ id: d.id, catKey: key, catLabel })
    })

    // Fix labels order once, based on categories we saw in recipes
    labelsRef = Array.from(bucketsAll.values()).map((b) => b.label)

    // Compute final "All" values aligned with labelsRef
    allValues = labelsRef.map((label) => {
      const key = toKey(label)
      const b = bucketsAll.get(key)
      const v = b && b.sumCount > 0 ? b.sumWeighted / b.sumCount : 0
      return Number.isFinite(v) ? Number(v.toFixed(2)) : 0
    })

    // 2) Read ratings per recipe to prepare Male/Female views.
    //    Also collect all userIds encountered so we can fetch genders once.
    const allRatings = [] // { userId, value, catKey }
    const uidSet = new Set()

    for (const row of recipeRows) {
      const ratingsCol = collection(db, 'recipes', row.id, 'ratings')
      const ratingsSnap = await getDocs(ratingsCol)

      ratingsSnap.forEach((rdoc) => {
        const data = rdoc.data() || {}
        const value = Number(data.value || 0)
        if (!Number.isFinite(value)) return // skip corrupted values
        allRatings.push({ userId: rdoc.id, value, catKey: row.catKey })
        uidSet.add(rdoc.id) // track unique rater ids
      })
    }

    // 3) Fetch gender for each user that appears in ratings
    //    Simple loop with getDoc for clarity (datasets here are small)
    const genderByUid = new Map()
    for (const uid of uidSet) {
      const us = await getDoc(doc(db, 'users', uid))
      const g = (us.exists() && (us.data().gender || '')).toString().toLowerCase()
      genderByUid.set(uid, g) // 'male' | 'female' | '' (unknown)
    }

    // 4) Aggregate per gender + per category
    //    We store plain sums and counts, then compute averages.
    const maleMap = new Map() // key -> { sum, count }
    const femaleMap = new Map() // key -> { sum, count }

    for (const r of allRatings) {
      const g = genderByUid.get(r.userId)
      if (g !== 'male' && g !== 'female') continue // ignore unknown gender
      const target = g === 'male' ? maleMap : femaleMap
      if (!target.has(r.catKey)) target.set(r.catKey, { sum: 0, count: 0 })
      const b = target.get(r.catKey)
      b.sum += r.value
      b.count += 1
    }

    // Build arrays aligned to labelsRef (missing categories become 0)
    maleValues = labelsRef.map((label) => {
      const b = maleMap.get(toKey(label))
      const v = b && b.count > 0 ? b.sum / b.count : 0
      return Number(v.toFixed(2))
    })
    femaleValues = labelsRef.map((label) => {
      const b = femaleMap.get(toKey(label))
      const v = b && b.count > 0 ? b.sum / b.count : 0
      return Number(v.toFixed(2))
    })

    // 5) Initial render: show "All" by default
    setChartFor('all')
  } catch (e) {
    console.error('[RecipeAnalyze] load failed:', e) // dev-friendly error
  } finally {
    loading.value = false // hide loader regardless of success/failure
  }
})
</script>

<style scoped>
.card {
  border: 1px solid #eee;
}
</style>
