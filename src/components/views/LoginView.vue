<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'

const router = useRouter()
const auth = getAuth()

const LoginData = ref({
  email: '',
  password: '',
})

const errors = ref({
  email: null,
  password: null,
  login: null,
})

const validateEmail = (blur) => {
  if (!LoginData.value.email) {
    if (blur) errors.value.email = 'Email is required'
  } else {
    errors.value.email = null
  }
}

const validatePassword = (blur) => {
  if (!LoginData.value.password) {
    if (blur) errors.value.password = 'Password is required'
  } else {
    errors.value.password = null
  }
}

const submitLogin = async () => {
  validateEmail(true)
  validatePassword(true)

  if (!errors.value.email && !errors.value.password) {
    try {
      await signInWithEmailAndPassword(auth, LoginData.value.email, LoginData.value.password)
      alert('Login successful!')
      router.push('/home')
    } catch (error) {
      console.error(error.code)
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        errors.value.login = 'Email or password is incorrect'
      } else {
        errors.value.login = 'Login failed. Please try again.'
      }
    }
  }
}

const clearForm = () => {
  LoginData.value = { email: '', password: '' }
  errors.value = { email: null, password: null, login: null }
}
</script>

<template>
  <div class="mt-5">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1>Login</h1>
        <p>Please log in with your registered email and password.</p>

        <form @submit.prevent="submitLogin">
          <div class="row mb-3">
            <div class="col-md-8 offset-md-2">
              <label for="email" class="form-label">Email</label>
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="LoginData.email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
              />
              <p v-if="errors.email" class="text-danger">{{ errors.email }}</p>
            </div>
          </div>

          <div class="row mb-3">
            <div class="col-md-8 offset-md-2">
              <label for="password" class="form-label">Password</label>
              <input
                id="password"
                type="password"
                class="form-control"
                v-model="LoginData.password"
                @blur="() => validatePassword(true)"
                @input="() => validatePassword(false)"
              />
              <p v-if="errors.password" class="text-danger">{{ errors.password }}</p>
            </div>
          </div>

          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Login</button>
            <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
          </div>

          <p v-if="errors.login" class="text-danger mt-2">
            {{ errors.login }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
