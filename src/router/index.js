import { createRouter, createWebHistory } from 'vue-router'
import { authState } from '../stores/auth'

import HomeView from '../components/views/HomeView.vue'
import AboutView from '../components/views/AboutView.vue'
import LoginView from '../components/views/LoginView.vue'
import RegisterView from '../components/views/RegisterView.vue'
import AddRecipeView from '../components/views/AddRecipeView.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: HomeView },

  { path: '/about', name: 'About', component: AboutView },

  { path: '/login', name: 'Login', component: LoginView, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: RegisterView, meta: { requiresGuest: true } },

  { path: '/:pathMatch(.*)*', redirect: '/home' },
  {
    path: '/addrecipe',
    name: 'AddRecipe',
    component: AddRecipeView,
    meta: { requiresAdmin: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const isAuthed = !!authState.user
  const role = authState.role
  if (to.meta?.requiresGuest && isAuthed) {
    return next('/home')
  }
  if (to.meta?.requiresAdmin) {
    return role === 'admin' ? next() : next('/home')
  }
  next()
})

export default router
