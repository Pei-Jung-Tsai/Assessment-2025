<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import db from '../../firebase/init.js'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import DatePicker from 'primevue/datepicker'
import axios from 'axios'

const router = useRouter()
const auth = getAuth()

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

const passwordHints = ref({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
})

const validateFullname = (blur) => {
  const ok = RegisterForm.value.fullname.trim().length >= 3
  errors.value.fullname = !ok && blur ? 'Full name must be at least 3 characters.' : null
}

const validateDob = (blur) => {
  const ok = !!RegisterForm.value.dob
  errors.value.dob = !ok && blur ? 'Please select your date of birth.' : null
}

const validateGender = (blur) => {
  const ok = !!RegisterForm.value.gender
  errors.value.gender = !ok && blur ? 'Please select a gender.' : null
}

const validatePhone = (blur) => {
  const phonePattern = /^\d{10}$/
  const ok = phonePattern.test(RegisterForm.value.phone)
  errors.value.phone = !ok && blur ? 'Please enter a valid 10-digit phone number.' : null
}

const validateEmail = (blur) => {
  const format = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const ok = format.test(RegisterForm.value.email)
  errors.value.email = !ok && blur ? 'Invalid email format' : null
}

const validatePassword = (blur) => {
  const p = RegisterForm.value.password
  const minLength = 8
  passwordHints.value.length = p.length >= minLength
  passwordHints.value.uppercase = /[A-Z]/.test(p)
  passwordHints.value.lowercase = /[a-z]/.test(p)
  passwordHints.value.number = /\d/.test(p)
  passwordHints.value.special = /[!@#$%^&*(),.?":{}|<>]/.test(p)

  const ok =
    passwordHints.value.length &&
    passwordHints.value.uppercase &&
    passwordHints.value.lowercase &&
    passwordHints.value.number &&
    passwordHints.value.special
  errors.value.password = !ok && blur ? 'Password does not meet all requirements.' : null
}

const validateConfirm = (blur) => {
  const ok = RegisterForm.value.confirmPassword === RegisterForm.value.password
  errors.value.confirmPassword = !ok && blur ? 'Passwords do not match.' : null
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
  globalError.value = null
}
const globalError = ref(null)

async function submitForm() {
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
    try {
      const email = RegisterForm.value.email.trim().toLowerCase()
      const cred = await createUserWithEmailAndPassword(auth, email, RegisterForm.value.password)
      const uid = cred.user.uid

      await setDoc(
        doc(db, 'users', uid),
        {
          uid,
          email,
          fullName: RegisterForm.value.fullname.trim(),
          dob: RegisterForm.value.dob || null,
          gender: RegisterForm.value.gender || null,
          phone: RegisterForm.value.phone || null,
          role: 'user',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      console.log('Register Successful!', cred)
      alert('Registration successful! Please log in.')
      router.push('/login')
    } catch (error) {
      console.error(error.code)
      globalError.value = 'This email is already registered'
    }
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
              <DatePicker
                v-model="RegisterForm.dob"
                inputId="dob"
                showIcon
                dateFormat="yy-mm-dd"
                class="w-100"
                @blur="validateDob(true)"
                @update:modelValue="validateDob(false)"
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
              <div v-if="errors.password" class="text-danger small">{{ errors.password }}</div>
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
            <p v-if="globalError" class="text-danger text-center mt-2">{{ globalError }}</p>
          </div>
        </form>
      </div>
    </div>
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
input[type='date'] {
  -webkit-appearance: auto;
  appearance: auto;
}
</style>
