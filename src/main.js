import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import router from './router'
import { initAuth } from './stores/auth'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import mapboxgl from 'mapbox-gl'

initAuth()
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const app = createApp(App)
app.use(router)
app.use(PrimeVue, { theme: { preset: Aura, options: { darkModeSelector: 'none' } } })

app.mount('#app')
