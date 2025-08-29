<script setup>
import { ref } from 'vue'
const RegisterForm = ref({
  fullname: '',
  dob: '',
  gender: '',
  email: '',
  password: '',
  confirmpassword: '',
})
function submitForm() {
  alert('Submitted ()')
}
function clearForm() {
  RegisterForm.value = {
    fullname: '',
    dob: '',
    gender: '',
    email: '',
    password: '',
    confirmpassword: '',
  }
}
</script>
<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-12 col-lg-8">
        <h2 class="text-center mb-4">Register</h2>

        <form @submit.prevent="submitForm" novalidate>
          <!-- Row 1 -->
          <div class="row g-3 mb-3">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="fullname">Full name</label>
              <input id="fullname" class="form-control" v-model="RegisterForm.fullname" required />
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label" for="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                class="form-control"
                v-model="RegisterForm.dob"
                required
              />
            </div>
          </div>
          <!-- Row 2 -->
          <div class="row g-3 mb-3">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="gender">Gender</label>
              <select id="gender" class="form-select" v-model="RegisterForm.gender" required>
                <option value="" disabled>Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="col-12 col-sm-6">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="RegisterForm.email"
                required
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
