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

      <Column field="dob" header="DOB" sortable filter>
        <template #filter>
          <InputText v-model="filters.dob.value" placeholder="Search dob" />
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

const filters = ref({
  fullName: { value: null, matchMode: FilterMatchMode.CONTAINS },
  email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  phone: { value: null, matchMode: FilterMatchMode.CONTAINS },
  gender: { value: null, matchMode: FilterMatchMode.CONTAINS },
  dob: { value: null, matchMode: FilterMatchMode.CONTAINS },
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
        return { id: userDoc.id, ...safe }
      })
    },
    (err) => {
      console.error('onSnapshot(users) error:', err)
    },
  )
})

onBeforeUnmount(() => {
  if (typeof unsubscribe === 'function') unsubscribe()
})

function fmtDate(v) {
  if (!v) return ''
  const d = v.toDate ? v.toDate() : new Date(v)
  return isNaN(d) ? String(v) : d.toLocaleDateString()
}
</script>

<style scoped>
.container {
  max-width: 900px;
}
</style>
