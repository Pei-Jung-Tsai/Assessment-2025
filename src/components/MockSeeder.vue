<template>
  <section class="card">
    <div class="card-body">
      <h5 class="mb-2">Mock Data Seeder (admin)</h5>
      <p class="text-muted small mb-3">
        Generate demo users (with <code>dob</code>), recipes, and ratings. You can delete later.
      </p>

      <div class="row g-2 mb-2">
        <div class="col-4">
          <label class="form-label small">Users to create</label>
          <input
            class="form-control form-control-sm"
            type="number"
            v-model.number="numUsers"
            min="2"
          />
        </div>
        <div class="col-4">
          <label class="form-label small">Recipes to create</label>
          <input
            class="form-control form-control-sm"
            type="number"
            v-model.number="numRecipes"
            min="1"
          />
        </div>
        <div class="col-4">
          <label class="form-label small">Ratings per recipe</label>
          <input
            class="form-control form-control-sm"
            type="number"
            v-model.number="ratingsPerRecipe"
            min="1"
          />
        </div>
      </div>

      <div class="d-flex align-items-center flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" :disabled="busy" @click="run">
          {{ busy ? 'Seeding…' : 'Generate Mock Data' }}
        </button>

        <!-- 刪 mock users -->
        <button class="btn btn-sm btn-outline-danger" :disabled="busy" @click="deleteMockUsers">
          Delete mock users
        </button>

        <!-- ✅ 新增：刪 mock recipes（包含 ratings 子集合） -->
        <button class="btn btn-sm btn-outline-danger" :disabled="busy" @click="deleteMockRecipes">
          Delete mock recipes
        </button>

        <span class="ms-2 small" v-if="statusMessage">{{ statusMessage }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import db from '@/firebase/init.js'
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
} from 'firebase/firestore'

const numUsers = ref(20)
const numRecipes = ref(10)
const ratingsPerRecipe = ref(12)
const busy = ref(false)
const statusMessage = ref('')

// ---- Mock pools ----
const firstNames = [
  'Ava',
  'Ben',
  'Chloe',
  'Dylan',
  'Ella',
  'Finn',
  'Grace',
  'Hugo',
  'Ivy',
  'Jack',
  'Kai',
  'Lily',
  'Mia',
  'Noah',
  'Owen',
  'Piper',
  'Quinn',
  'Ruby',
  'Sofia',
  'Theo',
]
const lastNames = [
  'Smith',
  'Brown',
  'Lee',
  'Wilson',
  'Taylor',
  'Martin',
  'Clark',
  'Young',
  'Hall',
  'King',
]
const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert']
const titlesPool = [
  'Avocado Salad',
  'Oatmeal Smoothie',
  'Roasted Veg Bowl',
  'Lean Chicken Wrap',
  'Tofu Stir Fry',
  'Berry Yogurt',
  'Quinoa Power Bowl',
  'Green Goddess Pasta',
  'Pumpkin Soup',
  'Egg White Scramble',
  'Grilled Salmon',
  'Chickpea Curry',
  'Zoodle Bolognese',
  'Greek Salad',
  'Miso Mushroom Rice',
]

// ---- Helpers ----
const rand = (n) => Math.floor(Math.random() * n)
const choice = (arr) => arr[rand(arr.length)]
const randPhone = () => `+61 4${rand(90000000) + 10000000}`
const randTime = () => 5 + rand(55)
const rid = () => Math.random().toString(36).slice(2, 10)

function randomDobTimestamp() {
  const start = new Date(1985, 0, 1).getTime()
  const end = new Date(2006, 11, 31).getTime()
  const t = start + Math.random() * (end - start)
  return Timestamp.fromDate(new Date(t))
}

// ---------- Delete mock users ----------
async function deleteMockUsers() {
  if (busy.value) return
  if (!confirm('Delete ALL mock users? This cannot be undone.')) return
  busy.value = true
  statusMessage.value = ''
  try {
    const snap = await getDocs(collection(db, 'users'))
    let delCount = 0
    for (const d of snap.docs) {
      const u = d.data() || {}
      const isMock =
        u.isMock === true || (typeof u.email === 'string' && u.email.endsWith('@demo.local'))
      if (isMock) {
        await deleteDoc(doc(db, 'users', d.id))
        delCount++
      }
    }
    statusMessage.value = `Deleted ${delCount} mock users.`
    alert(`✅ Deleted ${delCount} mock users.`)
  } catch (e) {
    console.error('[MockSeeder] deleteMockUsers failed:', e)
    alert('Delete users failed. See console.')
  } finally {
    busy.value = false
  }
}

// ---------- ✅ Delete mock recipes (with ratings subcollection) ----------
async function deleteMockRecipes() {
  if (busy.value) return
  if (!confirm('Delete ALL mock recipes (createdBy="mock-seeder") including ratings?')) return
  busy.value = true
  statusMessage.value = ''
  try {
    const qRecipes = query(collection(db, 'recipes'), where('createdBy', '==', 'mock-seeder'))
    const snap = await getDocs(qRecipes)

    let delRecipes = 0
    for (const d of snap.docs) {
      const recipeId = d.id

      // 1) delete ratings subcollection
      const ratingsCol = collection(db, 'recipes', recipeId, 'ratings')
      const ratingsSnap = await getDocs(ratingsCol)
      for (const r of ratingsSnap.docs) {
        await deleteDoc(doc(db, 'recipes', recipeId, 'ratings', r.id))
      }

      // 2) delete the recipe document
      await deleteDoc(doc(db, 'recipes', recipeId))
      delRecipes++
    }

    statusMessage.value = `Deleted ${delRecipes} mock recipes (and their ratings).`
    alert(`✅ Deleted ${delRecipes} mock recipes (with ratings).`)
  } catch (e) {
    console.error('[MockSeeder] deleteMockRecipes failed:', e)
    alert('Delete recipes failed. See console.')
  } finally {
    busy.value = false
  }
}

// ---------- Seed users + recipes + ratings ----------
async function run() {
  if (busy.value) return
  busy.value = true
  statusMessage.value = ''

  try {
    // 1) users
    const userIds = []
    for (let i = 0; i < numUsers.value; i++) {
      const id = rid()
      userIds.push(id)
      await setDoc(doc(db, 'users', id), {
        uid: id,
        email: `${id}@demo.local`,
        fullName: `${choice(firstNames)} ${choice(lastNames)}`,
        gender: Math.random() < 0.5 ? 'male' : 'female',
        phone: randPhone(),
        role: 'user',
        dob: randomDobTimestamp(),
        isMock: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    // 2) recipes + ratings + aggregates
    for (let i = 0; i < numRecipes.value; i++) {
      const title = choice(titlesPool) + ' ' + (100 + rand(900))
      const category = choice(categories)

      const recipeRef = await addDoc(collection(db, 'recipes'), {
        title,
        category,
        time: randTime(),
        image: '',
        ingredients: [],
        steps: [],
        ratingCount: 0,
        ratingSum: 0,
        avgRating: 0,
        createdAt: serverTimestamp(),
        createdBy: 'mock-seeder', // 👈 供刪除查詢
      })

      const picked = new Set()
      while (picked.size < Math.min(ratingsPerRecipe.value, userIds.length)) {
        picked.add(choice(userIds))
      }

      let sum = 0
      let count = 0
      for (const uid of picked) {
        const value = 1 + rand(5)
        await setDoc(doc(db, 'recipes', recipeRef.id, 'ratings', uid), { value })
        sum += value
        count++
      }

      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0
      await updateDoc(recipeRef, {
        ratingCount: count,
        ratingSum: sum,
        avgRating: avg,
        updatedAt: serverTimestamp(),
      })
    }

    statusMessage.value = `Done. Users +${numUsers.value}, Recipes +${numRecipes.value}.`
    alert('✅ Mock data generated successfully!')
  } catch (e) {
    console.error('[MockSeeder] run failed:', e)
    alert('Mock seeding failed. See console.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.card {
  border: 1px solid #eee;
}
</style>
