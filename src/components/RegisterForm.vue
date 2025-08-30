<script setup>
import { ref } from 'vue'

const RegisterForm = ref({
  fullname: '',
  dob: '',
  gender: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
})

const errors = ref({
  fullname: null,
  dob: null,
  gender: null,
  email: null,
  password: null,
  confirmPassword: null,
  phone: null,
})

const registeredUsers = ref([])

function submitForm() {
  validateFullname(true)
  validateDob(true)
  validateGender(true)
  validatePhone(true)
  validateEmail(true)
  validatePassword(true)
  validateConfirm(true)

  if (
    !errors.value.fullname &&
    !errors.value.dob &&
    !errors.value.gender &&
    !errors.value.phone &&
    !errors.value.email &&
    !errors.value.password &&
    !errors.value.confirmPassword
  ) {
    registeredUsers.value.push({ ...RegisterForm.value })
    clearForm()
    alert('Submitted :)')
  }
}

function clearForm() {
  RegisterForm.value = {
    fullname: '',
    dob: '',
    gender: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  }
  errors.value = {
    fullname: null,
    dob: null,
    gender: null,
    email: null,
    password: null,
    confirmPassword: null,
    phone: null,
  }
}

const validateEmail = (blur) => {
  const format = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!format.test(RegisterForm.value.email)) {
    if (blur) errors.value.email = 'Invalid email format'
  } else {
    errors.value.email = null
  }
}

const passwordHints = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
})
const validatePassword = (blur) => {
  const password = RegisterForm.value.password
  const minLength = 8

  passwordHints.value.length = password.length >= minLength
  passwordHints.value.uppercase = /[A-Z]/.test(password)
  passwordHints.value.lowercase = /[a-z]/.test(password)
  passwordHints.value.number = /\d/.test(password)
  passwordHints.value.special = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (
    !passwordHints.value.length ||
    !passwordHints.value.uppercase ||
    !passwordHints.value.lowercase ||
    !passwordHints.value.number ||
    !passwordHints.value.special
  ) {
    if (blur) errors.value.password = 'Password does not meet all requirements.'
  } else {
    errors.value.password = null
  }
}

const validateConfirm = (blur) => {
  if (RegisterForm.value.confirmPassword !== RegisterForm.value.password) {
    if (blur) errors.value.confirmPassword = 'Passwords do not match.'
  } else {
    errors.value.confirmPassword = null
  }
}

const validateFullname = (blur) => {
  const namelength = RegisterForm.value.fullname.trim().length >= 3
  if (!namelength) {
    if (blur) errors.value.fullname = 'Full name must be at least 3 characters.'
  } else {
    errors.value.fullname = null
  }
}

const validateDob = (blur) => {
  const dob = RegisterForm.value.dob
  if (!dob) {
    if (blur) errors.value.dob = 'Please select your date of birth.'
  } else {
    errors.value.dob = null
  }
}

const validateGender = (blur) => {
  const gender = RegisterForm.value.gender
  if (!gender) {
    if (blur) errors.value.gender = 'Please select a gender.'
  } else {
    errors.value.gender = null
  }
}

const validatePhone = (blur) => {
  const phonePattern = /^\d{10}$/
  const phone = phonePattern.test(RegisterForm.value.phone)
  if (!phone) {
    if (blur) errors.value.phone = 'Please enter a valid 10-digit phone number.'
  } else {
    errors.value.phone = null
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
              <input
                id="fullname"
                class="form-control"
                v-model="RegisterForm.fullname"
                placeholder="e.g. Pei-Jung Tsai"
                @blur="validateFullname(true)"
                @input="validateFullname(false)"
              />
              <div v-if="errors.fullname" class="text-danger small">
                {{ errors.fullname }}
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label" for="dob">Date of Birth</label>
              <input
                id="dob"
                type="date"
                class="form-control"
                v-model="RegisterForm.dob"
                @blur="validateDob(true)"
                @change="validateDob(false)"
              />
              <div v-if="errors.dob" class="text-danger small">{{ errors.dob }}</div>
            </div>
          </div>

          <!-- Row 2 -->
          <div class="row g-3 mb-3">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="gender">Gender</label>
              <select
                id="gender"
                class="form-select"
                v-model="RegisterForm.gender"
                @blur="validateGender(true)"
                @change="validateGender(false)"
              >
                <option value="" disabled>Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
              <div v-if="errors.gender" class="text-danger small">{{ errors.gender }}</div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label" for="phone">Phone</label>
              <input
                id="phone"
                type="tel"
                class="form-control"
                v-model="RegisterForm.phone"
                @blur="validatePhone(true)"
                @input="validatePhone(false)"
                placeholder="e.g. 0487654321"
              />
              <div v-if="errors.phone" class="text-danger small">{{ errors.phone }}</div>
            </div>
          </div>

          <!-- Row 3 -->
          <div class="row g-3 mb-3">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="email">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="RegisterForm.email"
                placeholder="e.g.xxx@gmail.com"
                @blur="validateEmail(true)"
                @input="validateEmail(false)"
              />
              <div v-if="errors.email" class="text-danger small">{{ errors.email }}</div>
            </div>
          </div>

          <!-- Row 4-->
          <div class="row g-3 mb-3">
            <div class="col-12 col-sm-6">
              <label class="form-label" for="password">Password</label>
              <input
                id="password"
                type="password"
                class="form-control"
                v-model="RegisterForm.password"
                @blur="validatePassword(true)"
                @input="validatePassword(false)"
              />
              <div v-if="RegisterForm.password" class="small mt-1">
                <ul class="list-unstyled">
                  <li :class="passwordHints.length ? 'text-success' : 'text-danger'">
                    At least 8 characters
                  </li>
                  <li :class="passwordHints.uppercase ? 'text-success' : 'text-danger'">
                    At least 1 uppercase letter
                  </li>
                  <li :class="passwordHints.lowercase ? 'text-success' : 'text-danger'">
                    At least 1 lowercase letter
                  </li>
                  <li :class="passwordHints.number ? 'text-success' : 'text-danger'">
                    At least 1 number
                  </li>
                  <li :class="passwordHints.special ? 'text-success' : 'text-danger'">
                    At least 1 special character
                  </li>
                </ul>
              </div>
            </div>

            <div class="col-12 col-sm-6">
              <label class="form-label" for="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                class="form-control"
                v-model="RegisterForm.confirmPassword"
                @blur="validateConfirm(true)"
                @input="validateConfirm(false)"
              />
              <div v-if="errors.confirmPassword" class="text-danger small">
                {{ errors.confirmPassword }}
              </div>
            </div>
          </div>

          <div class="text-center">
            <button class="btn btn-primary me-2" type="submit">Submit</button>
            <button class="btn btn-outline-secondary" type="button" @click="clearForm">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <div v-if="registeredUsers.length" class="mt-4">
    <h3>Registered Users</h3>
    <ul>
      <li v-for="(u, i) in registeredUsers" :key="i">{{ u.fullname }} - {{ u.email }}</li>
    </ul>
  </div>
</template>

<style scoped>
.form-control::placeholder {
  color: #ccc;
  opacity: 1;
}
input[type='date']::-webkit-datetime-edit {
  color: #ccc;
  opacity: 1;
}
.placeholder {
  color: #ccc;
}
</style>
