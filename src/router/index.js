import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../components/views/HomeView.vue'
import AboutView from '../components/views/AboutView.vue'
import LoginView from '../components/views/LoginView.vue'
import RegisterView from '../components/views/RegisterView.vue'

import { getAuth, onAuthStateChanged } from 'firebase/auth'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: HomeView },

  { path: '/about', name: 'About', component: AboutView },

  { path: '/login', name: 'Login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { requiresGuest: true } },

  { path: '/:pathMatch(.*)*', redirect: '/home' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
