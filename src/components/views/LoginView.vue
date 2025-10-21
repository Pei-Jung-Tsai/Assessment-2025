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
  <!--  Landmark & naming for screen readers
       Use a <section> with an accessible name that points to the H1.
       let reader know it is login section -->
  <section class="mt-5" aria-labelledby="login-heading">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <!-- Page heading is referenced by aria-labelledby above
              -->
        <h1 id="login-heading">Login</h1>

        <p class="text-muted">
          <!-- Short helper text improves clarity for screen readers.
               -->
          Please log in with your registered email and password.
        </p>

        <form @submit.prevent="submitLogin" novalidate>
          <!-- Email field -->
          <div class="row mb-3">
            <div class="col-md-8 offset-md-2">
              <!-- Proper label ties to the input by id
                  -->
              <label for="email" class="form-label">Email address</label>

              <!-- Accessibility adds:
                   - required + aria-required
                   - autocomplete="email"
                   - aria-describedby
                   - :aria-invalid
                    -->
              <input
                id="email"
                type="email"
                class="form-control"
                v-model="LoginData.email"
                @blur="() => validateEmail(true)"
                @input="() => validateEmail(false)"
                required
                aria-required="true"
                autocomplete="email"
                :aria-invalid="!!errors.email"
                aria-describedby="email-hint"
              />

              <!-- Hint + error live region
                   - role="status" aria-live="polite"
                   -  role="alert"
                   -->
              <small id="email-hint" class="form-text text-muted">
                Enter your registered email.
              </small>
              <p v-if="errors.email" class="text-danger mt-1" role="alert">
                {{ errors.email }}
              </p>
            </div>
          </div>

          <!-- Password field -->
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
                required
                aria-required="true"
                autocomplete="current-password"
                :aria-invalid="!!errors.password"
                aria-describedby="password-hint"
              />
              <small id="password-hint" class="form-text text-muted">
                At least 6 characters.
              </small>
              <p v-if="errors.password" class="text-danger mt-1" role="alert">
                {{ errors.password }}
              </p>
            </div>
          </div>

          <!-- Actions: buttons are naturally keyboard-accessible
               use button to support Tab / Enter / Space -->
          <div class="text-center">
            <button type="submit" class="btn btn-primary me-2">Login</button>
            <button type="button" class="btn btn-secondary" @click="clearForm">Clear</button>
          </div>

          <!-- Secondary navigation link with clear name
               use aria-label-->
          <div class="text-center mt-3">
            <router-link
              to="/register"
              class="text-decoration-none"
              aria-label="Go to register page"
            >
              Don't have an account? <span class="fw-semibold">Sign up</span>
            </router-link>
          </div>

          <!-- Global login error (e.g., wrong password)
               Use role="alert" to announce immediately.
               -->
          <p v-if="errors.login" class="text-danger mt-2" role="alert">
            {{ errors.login }}
          </p>
        </form>
      </div>
    </div>
  </section>
</template>
