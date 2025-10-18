<template>
  <div class="container py-4">
    <h2 class="mb-3">Users</h2>
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
    >
      <div class="stats mb-3">
        <div class="stat-chip">
          <div class="label">Total users</div>
          <div class="value">{{ totalUsers }}</div>
        </div>
      </div>
      <Column field="fullName" header="Full name" sortable filter>
        <template #filter>
          <InputText v-model="filters.fullName.value" placeholder="Search name" />
        </template>
      </Column>

      <Column field="email" header="Email" sortable filter>
        <template #filter>
          <InputText v-model="filters.email.value" placeholder="Search email" />
        </template>
      </Column>

      <Column field="phone" header="Phone" sortable filter>
        <template #filter>
          <InputText v-model="filters.phone.value" placeholder="Search phone" />
        </template>
      </Column>

      <Column field="gender" header="Gender" sortable filter>
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
  </div>
</template>

<script setup>
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
    },
    (err) => {
      console.error('onSnapshot(users) error:', err)
    },
  )
  fetchTotalUsers()
})

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

function fmtDate(v) {
  if (!v) return ''
  const d = v.toDate ? v.toDate() : new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleDateString()
}
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
