<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getAuth } from 'firebase/auth'
import db from '../../firebase/init'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore'

const recipes = ref([]) // list of recipes
let unsubscribe = null //  onSnapshot cleanup

//read recipes (realtime)
onMounted(() => {
  const q = query(collection(db, 'recipes'), orderBy('title'))
  unsubscribe = onSnapshot(q, (snap) => {
    recipes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  })
})

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

// user rates 1~5 stars with transaction
// Add or update the current user's rating for a recipe, and update aggregates.
async function rateRecipe(recipeId, newValue) {
  // Require login
  const uid = getAuth().currentUser?.uid
  if (!uid) {
    alert('Please log in to rate this recipe.')
    return
  }
  // recipe doc & per-user rating doc
  const recipeRef = doc(db, 'recipes', recipeId)
  const ratingRef = doc(db, 'recipes', recipeId, 'ratings', uid)

  // Transaction keeps aggregates correct even with concurrent ratings.
  await runTransaction(db, async (transaction) => {
    // Read current aggregates and my previous rating
    const [recipeSnap, ratingSnap] = await Promise.all([
      transaction.get(recipeRef),
      transaction.get(ratingRef),
    ])

    // previous rating by this user (0 if none)
    const oldVal = ratingSnap.exists() ? ratingSnap.data().value || 0 : 0
    const delta = newValue - oldVal

    // upsert my rating under /ratings/{uid}
    transaction.set(
      ratingRef,
      { value: newValue, userId: uid, updatedAt: serverTimestamp() },
      { merge: true },
    )

    // read current aggregates from recipe
    const currecipe = recipeSnap.exists() ? recipeSnap.data() : {}
    const oldCount = Number(currecipe.ratingCount || 0)
    const oldSum = Number(currecipe.ratingSum || 0)

    // first time rating : increase rater count by 1
    const nextCount = oldVal === 0 ? oldCount + 1 : oldCount
    const nextSum = oldSum + delta
    const nextAvg = nextCount > 0 ? nextSum / nextCount : 0

    // Write back aggregates to the recipe document
    transaction.update(recipeRef, {
      ratingCount: nextCount,
      ratingSum: nextSum,
      avgRating: nextAvg,
      updatedAt: serverTimestamp(),
    })
  })
}

// Format average rating to one decimal (e.g., 4.2)
function fmtAvg(v) {
  const n = Number(v || 0)
  return Number.isFinite(n) ? n.toFixed(1) : '0.0'
}
</script>

<template>
  <!--  Page section named by the H2 (helps screen readers jump here) -->
  <section class="container py-4" aria-labelledby="recipes-heading">
    <!--  Heading is referenced by aria-labelledby above -->
    <h2 id="recipes-heading" class="mb-4">Recipes</h2>

    <!--  Status message (announced when it appears) -->
    <div v-if="recipes.length === 0" class="text-muted" role="status" aria-live="polite">
      No recipes yet.
    </div>

    <!-- Treat the grid as a list for assistive tech -->
    <div class="row g-4" role="list" aria-label="Recipe list">
      <div
        v-for="r in recipes"
        :key="r.id"
        class="col-12 col-md-6 col-lg-4"
        role="listitem"
        aria-label="Recipe card"
      >
        <div class="card h-100 shadow-sm">
          <!--  Meaningful alt text that includes the recipe title -->
          <img
            v-if="r.image"
            :src="r.image"
            class="card-img-top object-fit-cover"
            :alt="`Image of recipe: ${r.title}`"
            style="height: 180px"
          />

          <div class="card-body d-flex flex-column">
            <!--  Card title read as the name of this item -->
            <h5 class="card-title mb-1">{{ r.title }}</h5>

            <!--  Secondary info (category/time) - left as plain text; OK for SR -->
            <p class="text-secondary small mb-2">
              <span v-if="r.category">#{{ r.category }}</span>
              <span v-if="r.time">&nbsp;•&nbsp;{{ r.time }} mins</span>
            </p>

            <!--  Average and count - read naturally as text -->
            <p class="mb-2">
              <strong>{{ fmtAvg(r.avgRating) }}★</strong>
              <span class="text-muted"> ({{ r.ratingCount || 0 }} ratings)</span>
            </p>

            <!--  Rating control: group + clear labels + keyboard ready -->
            <div
              class="d-flex gap-2 mt-auto"
              role="group"
              :aria-label="`Rate ${r.title} from 1 to 5 stars`"
            >
              <button
                v-for="n in 5"
                :key="n"
                type="button"
                class="btn btn-outline-primary btn-sm"
                @click="rateRecipe(r.id, n)"
                :aria-label="`${n} star${n > 1 ? 's' : ''} for ${r.title}`"
              >
                {{ n }}★
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.object-fit-cover {
  object-fit: cover;
}
</style>
