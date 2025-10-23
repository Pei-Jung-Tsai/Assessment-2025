<template>
  <!--  Accessible region named by heading (landmark-like)  -->
  <section class="card" aria-labelledby="ratings-heading">
    <div class="card-body">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <!--  Heading also serves as accessible name for the section -->
        <h5 id="ratings-heading" class="mb-0">Average Rating by Category</h5>

        <!--  UI controls on the right: three view buttons + one export button -->
        <div class="d-flex align-items-center gap-2">
          <!--  View toggle: clicking these swaps the dataset shown in the SAME chart -->
          <div class="btn-group btn-group-sm" role="group" aria-label="Switch chart view">
            <button
              class="btn"
              :class="currentView === 'all' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="switchView('all')"
              :aria-pressed="currentView === 'all'"
              aria-label="Show All users' average"
            >
              All
            </button>
            <button
              class="btn"
              :class="currentView === 'male' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="switchView('male')"
              :aria-pressed="currentView === 'male'"
              aria-label="Show Male users' average"
            >
              Male
            </button>
            <button
              class="btn"
              :class="currentView === 'female' ? 'btn-primary' : 'btn-outline-secondary'"
              @click="switchView('female')"
              :aria-pressed="currentView === 'female'"
              aria-label="Show Female users' average"
            >
              Female
            </button>
          </div>

          <!--  [EXPORT] One click: export the CURRENT chart view (All/Male/Female) to a PDF -->
          <button
            class="btn btn-sm btn-outline-secondary"
            @click="exportPdf"
            aria-label="Export current chart as PDF"
          >
            Export PDF
          </button>
        </div>
      </div>

      <!--  Quick explanation how to compute each view -->
      <p class="text-muted small mb-3">
        All = weighted by recipe rating counts. Male/Female = per-user average within each category.
      </p>

      <!--  Simple loading state while Firestore is fetching -->
      <div v-if="loading" class="text-muted small" role="status" aria-live="polite">
        Loading chart...
      </div>

      <!--  Single Chart within a <figure>; canvas is hidden from screen readers,
           description provided via <figcaption> -->
      <figure v-else aria-describedby="ratings-caption">
        <Chart
          ref="chartRef"
          type="bar"
          :data="chartData"
          :options="chartOptions"
          style="max-height: 460px"
          aria-hidden="true"
        />
        <!--  Text alternative describing the chart content/purpose -->
        <figcaption id="ratings-caption" class="visually-hidden">
          Bar chart showing average recipe ratings by category. Use the buttons to switch All, Male,
          or Female view.
        </figcaption>
      </figure>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Chart from 'primevue/chart'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import db from '@/firebase/init.js'
import { jsPDF } from 'jspdf' // Library to create a PDF

//  Reactive state for UI and chart
const loading = ref(true) //  true until data has finished loading
const currentView = ref('all') //  which dataset to show in the chart (all / male / female)
const chartRef = ref(null) // reference to Chart.js instance (for export)

// Chart.js data formation { labels, datasets[] }. We will replace this object on toggle.
const chartData = ref({
  labels: [],
  datasets: [{ label: 'Avg ★ by Category (All)', data: [] }],
})

//  Basic chart options: make it responsive, y-axis 0..5, show legend & tooltip.
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

// functions to keep category names clean and groupable
// If empty, show 'Uncategorized'; also remove extra spaces.
function normCategory(rawCategory) {
  return String(rawCategory || 'Uncategorized').trim()
}

//  Lowercased Category
function toKey(normalizedCategory) {
  return normCategory(normalizedCategory).toLowerCase()
}

//  These arrays feed the chart; all share the same label order:
//   - allValues   : weighted average using recipe aggregates
//   - maleValues  : average of individual ratings from male users
//   - femaleValues: average of individual ratings from female users

let labelsRef = [] //  the fixed x-axis labels (category names)
let allValues = [] //  "All" dataset
let maleValues = [] //  "Male" dataset
let femaleValues = [] // "Female" dataset

//  Swap the dataset shown by the chart without recreating the component
function setChartFor(viewName) {
  let datasetValues, datasetLabel
  if (viewName === 'male') {
    datasetValues = maleValues
    datasetLabel = 'Avg ★ by Category (Male)'
  } else if (viewName === 'female') {
    datasetValues = femaleValues
    datasetLabel = 'Avg ★ by Category (Female)'
  } else {
    datasetValues = allValues
    datasetLabel = 'Avg ★ by Category (All)'
  }

  chartData.value = {
    labels: labelsRef, //  x-axis labels stay the same
    datasets: [{ label: datasetLabel, data: datasetValues }],
  }
}

//  Button handler: update state and refresh the chart's dataset
function switchView(nextView) {
  currentView.value = nextView
  setChartFor(nextView)
}

// [EXPORT] Export the CURRENT chart view as a PDF
async function exportPdf() {
  try {
    //  1) Grab the chart's canvas as an image
    const chartInstance = chartRef.value?.chart
    if (!chartInstance) {
      alert('Chart is not ready yet.')
      return
    }
    const canvas = chartInstance.canvas
    const imgData = canvas.toDataURL('image/png', 1.0)

    //  2) Prepare a PDF page (A4 portrait)
    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const pageMargin = 40

    //  3) Write title, which view it is, and a simple timestamp
    const title = 'Average Rating by Category'
    const viewName =
      currentView.value === 'male' ? 'Male' : currentView.value === 'female' ? 'Female' : 'All'
    const timestampText = new Date().toLocaleString('en-AU', { hour12: false })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text(title, pageMargin, pageMargin)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.text(`View: ${viewName}`, pageMargin, pageMargin + 18)
    doc.text(`Generated: ${timestampText}`, pageMargin, pageMargin + 34)

    //  4) Place the chart image, scaled to fit the page width
    const imageMaxWidth = pageWidth - pageMargin * 2
    const imageAspectRatio = canvas.height / canvas.width
    const imageWidth = imageMaxWidth
    const imageHeight = imageWidth * imageAspectRatio
    let cursorY = pageMargin + 50
    doc.addImage(imgData, 'PNG', pageMargin, cursorY, imageWidth, imageHeight, undefined, 'FAST')
    cursorY += imageHeight + 18

    //  5) Under the chart, list the numbers: "Category: 3.75"
    doc.setFont('helvetica', 'bold')
    doc.text('Data:', pageMargin, cursorY)
    cursorY += 14
    doc.setFont('helvetica', 'normal')

    const labels = chartData.value.labels || []
    const values = chartData.value.datasets?.[0]?.data || []
    const lines = labels.map((label, index) => `${label}: ${Number(values[index] ?? 0).toFixed(2)}`)

    // If content is long, continue on a new page
    const lineHeight = 14
    for (const oneLine of lines) {
      if (cursorY > pageHeight - pageMargin) {
        doc.addPage()
        cursorY = pageMargin
      }
      doc.text(oneLine, pageMargin, cursorY)
      cursorY += lineHeight
    }

    //  6) Save name
    const dateStr = new Date().toISOString().slice(0, 10)
    doc.save(`ratings_report_${dateStr}_${viewName}.pdf`)
  } catch (error) {
    console.error('Export PDF failed:', error)
    alert('Export failed. Please try again.')
  }
}

// Load Firestore data once the component is mounted
onMounted(async () => {
  try {
    // [CHART-All] 1) Read recipes and compute "All" using weighted averages
    //   weighted avg = Σ(avgRating × ratingCount) / Σ(ratingCount)
    const recipesSnap = await getDocs(collection(db, 'recipes'))

    // Buckets for All view, grouped by category key
    const bucketsAll = new Map() // key -> { label, sumWeighted, sumCount }
    const recipeRows = []

    recipesSnap.forEach((recipeDoc) => {
      const recipeData = recipeDoc.data() || {}
      const categoryLabel = normCategory(recipeData.category) // display label
      const categoryKey = toKey(categoryLabel) // grouping key
      const averageScore = Number(recipeData.avgRating || 0)
      const ratingCount = Number(recipeData.ratingCount || 0)

      if (!bucketsAll.has(categoryKey)) {
        bucketsAll.set(categoryKey, { label: categoryLabel, sumWeighted: 0, sumCount: 0 })
      }
      const bucket = bucketsAll.get(categoryKey)
      bucket.sumWeighted += averageScore * ratingCount
      bucket.sumCount += ratingCount

      recipeRows.push({ id: recipeDoc.id, catKey: categoryKey, catLabel: categoryLabel })
    })

    // Freeze labels order once (x-axis)
    labelsRef = Array.from(bucketsAll.values()).map((b) => b.label)

    // Build "All" values aligned to labelsRef
    allValues = labelsRef.map((label) => {
      const key = toKey(label)
      const bucket = bucketsAll.get(key)
      const value = bucket && bucket.sumCount > 0 ? bucket.sumWeighted / bucket.sumCount : 0
      return Number.isFinite(value) ? Number(value.toFixed(2)) : 0
    })

    // [CHART-Gender] 2) Read ratings subcollections to prepare Male/Female
    const allRatings = [] // { userId, value, catKey }
    const userIdSet = new Set()

    for (const row of recipeRows) {
      const ratingsCol = collection(db, 'recipes', row.id, 'ratings')
      const ratingsSnap = await getDocs(ratingsCol)

      ratingsSnap.forEach((ratingDoc) => {
        const ratingData = ratingDoc.data() || {}
        const oneScore = Number(ratingData.value || 0)
        if (!Number.isFinite(oneScore)) return
        allRatings.push({ userId: ratingDoc.id, value: oneScore, catKey: row.catKey })
        userIdSet.add(ratingDoc.id)
      })
    }

    // [CHART-Gender] 3) Fetch each user's gender for those who rated
    const genderByUserId = new Map()
    for (const oneUserId of userIdSet) {
      const userSnap = await getDoc(doc(db, 'users', oneUserId))
      const gender = (userSnap.exists() && (userSnap.data().gender || '')).toString().toLowerCase()
      genderByUserId.set(oneUserId, gender) // 'male' | 'female' | ''
    }

    // [CHART-Gender] 4) Sum and count per gender per category, then average
    const maleMap = new Map() // key -> { sum, count }
    const femaleMap = new Map() // key -> { sum, count }

    for (const rating of allRatings) {
      const gender = genderByUserId.get(rating.userId)
      if (gender !== 'male' && gender !== 'female') continue // skip unknown
      const targetMap = gender === 'male' ? maleMap : femaleMap
      if (!targetMap.has(rating.catKey)) targetMap.set(rating.catKey, { sum: 0, count: 0 })
      const bucket = targetMap.get(rating.catKey)
      bucket.sum += rating.value
      bucket.count += 1
    }

    // [CHART-Gender] 5) Build arrays aligned with labelsRef for male/female
    maleValues = labelsRef.map((label) => {
      const bucket = maleMap.get(toKey(label))
      const value = bucket && bucket.count > 0 ? bucket.sum / bucket.count : 0
      return Number(value.toFixed(2))
    })
    femaleValues = labelsRef.map((label) => {
      const bucket = femaleMap.get(toKey(label))
      const value = bucket && bucket.count > 0 ? bucket.sum / bucket.count : 0
      return Number(value.toFixed(2))
    })

    // [CHART] 6) First render: show All
    setChartFor('all')
  } catch (e) {
    console.error('[RecipeAnalyze] load failed:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.card {
  border: 1px solid #eee;
}
</style>
