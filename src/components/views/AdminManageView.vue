<template>
  <div class="container py-4">
    <!-- Users Section -->
    <section class="mb-4">
      <h2 class="mb-3">Users</h2>

      <div class="card mb-3">
        <div class="card-body">
          <div class="d-flex align-items-center gap-3 flex-wrap">
            <div class="px-3 py-2 rounded-3 border bg-light">
              <div class="text-muted small">Total users</div>
              <div class="fs-4 fw-bold">{{ totalUsers }}</div>
            </div>
            <div class="px-3 py-2 rounded-3 border bg-light">
              <div class="text-muted small">Under 25</div>
              <div class="fs-4 fw-bold">{{ under25 }}</div>
            </div>

            <div class="px-3 py-2 rounded-3 border bg-light">
              <div class="text-muted small">25+ years</div>
              <div class="fs-4 fw-bold">{{ gte25 }}</div>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        :value="users"
        v-model:filters="filters"
        paginator
        :rows="10"
        filterDisplay="menu"
        removableSort
        showGridlines
        stripedRows
        responsiveLayout="scroll"
        class="mb-4"
      >
        <Column field="fullName" header="Full name" sortable>
          <template #filter>
            <InputText v-model="filters.fullName.value" placeholder="Search name" />
          </template>
        </Column>

        <Column field="email" header="Email" sortable>
          <template #filter>
            <InputText v-model="filters.email.value" placeholder="Search email" />
          </template>
        </Column>

        <Column field="phone" header="Phone" sortable>
          <template #filter>
            <InputText v-model="filters.phone.value" placeholder="Search phone" />
          </template>
        </Column>

        <Column field="gender" header="Gender" sortable>
          <template #filter>
            <InputText v-model="filters.gender.value" placeholder="Search gender" />
          </template>
        </Column>

        <Column field="dobText" header="DOB" :sortable="true" sortField="_dob">
          <template #body="{ data }">
            {{ data.dobText }}
          </template>
          <template #filter>
            <InputText v-model="filters.dobText.value" placeholder="Search dob (YYYY-MM-DD)" />
          </template>
        </Column>
      </DataTable>
    </section>

    <hr class="my-4" />

    <!-- Recipes / Analytics Section  -->
    <section class="mb-5">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <h2 class="mb-0">Recipes Analytics</h2>
      </div>

      <RecipeAnalyze />
    </section>
  </div>
</template>

<script setup>
import RecipeAnalyze from '@/components/RecipeAnalyze.vue'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import { FilterMatchMode } from '@primevue/core/api'
import db from '@/firebase/init'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

const users = ref([])
const totalUsers = ref(0)

const filters = ref({
  fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
  gender: { value: null, matchMode: FilterMatchMode.CONTAINS },
  dobText: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

let unsubscribe = null
onMounted(() => {
  const userQuery = query(collection(db, 'users'), orderBy('fullName'))
  unsubscribe = onSnapshot(
    userQuery,
    (snap) => {
      users.value = snap.docs.map((userDoc) => {
        const data = userDoc.data() || {}
        const { password: _pw, confirmPassword: _cp, ...safe } = data
        const rawDob = data.dob ?? null
        const dobText = fmtDate(rawDob)
        return { id: userDoc.id, ...safe, _dob: rawDob, dobText }
      })
      fetchTotalUsers()
      fetchAgeBuckets()
    },
    (err) => {
      console.error('onSnapshot(users) error:', err)
    },
  )
  fetchTotalUsers()
  fetchAgeBuckets()
})

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

// Format DOB for table display
function fmtDate(v) {
  if (!v) return ''
  const d = v.toDate ? v.toDate() : new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleDateString()
}

//  get total users
async function fetchTotalUsers() {
  try {
    const URL = import.meta.env.VITE_GET_TOTAL_USERS_URL
    const resp = await fetch(URL)
    if (!resp.ok) throw new Error('Failed to fetch')
    const data = await resp.json()
    totalUsers.value = data.total || 0
  } catch (err) {
    console.error('fetchTotalUsers error:', err)
  }
}
// Age buckets state
const under25 = ref(0)
const gte25 = ref(0)

// get age buckets
async function fetchAgeBuckets() {
  try {
    const URL = import.meta.env.VITE_GET_AGE_COUNT_URL
    const resp = await fetch(URL)
    const data = await resp.json()
    if (!resp.ok) throw new Error(data?.error || 'Failed to fetch')

    // Backend returns { total, under25, gte25 }
    under25.value = data.under25 ?? 0
    gte25.value = data.gte25 ?? Math.max((data.total ?? 0) - (data.under25 ?? 0), 0)
  } catch (err) {
    console.error('fetchAgeBuckets error:', err)
  }
}
</script>

<style scoped>
.container {
  max-width: 900px;
}
.stats {
  margin-bottom: 1rem;
}
.stat-chip {
  display: inline-block;
  background: #f3f4f6;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
}
.label {
  font-size: 12px;
  color: #6b7280;
}
.value {
  font-size: 18px;
  color: #111827;
}
</style>
