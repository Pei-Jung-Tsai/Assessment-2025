<template>
  <div class="map-layout">
    <div id="map"></div>
    <aside class="side-panel">
      <div class="mb-2">
        <small class="text-muted d-block"
          >Location A = your current location. Click 'Route' to navigate.</small
        >
        <small v-if="statusMessage" class="text-muted d-block">{{ statusMessage }}</small>
      </div>

      <!-- Restaurant list -->
      <ul class="list-unstyled vstack gap-2 mb-3">
        <li v-for="r in restaurantList" :key="r.id" class="border rounded p-2">
          <div class="fw-semibold small">{{ r.name }}</div>
          <div class="text-muted small">
            <span>{{ r.address }}</span>
            <span v-if="r.phone"> · {{ r.phone }}</span>
          </div>

          <div class="mt-2 d-flex gap-2">
            <button
              class="btn btn-sm btn-outline-secondary"
              @click="locateRestaurant(r)"
              :disabled="!hasCoordinates(r)"
            >
              Locate
            </button>
            <button
              class="btn btn-sm btn-primary"
              @click="navigateToRestaurant(r)"
              :disabled="!hasCoordinates(r)"
            >
              Route
            </button>
          </div>

          <div v-if="!hasCoordinates(r)" class="text-muted small mt-1">
            No coordinates yet - fill latitude &amp; longitude to enable map actions.
          </div>
        </li>
      </ul>

      <!-- Admin-only  -->
      <section v-if="isAdmin" class="admin-form mt-3 pt-3 border-top">
        <h6 class="mb-2">Add Healthy Restaurant (admin)</h6>

        <form @submit.prevent="addHealthyRestaurant" class="vstack gap-2">
          <div>
            <label class="form-label mb-1 small">Name</label>
            <input v-model.trim="formName" class="form-control form-control-sm" required />
          </div>

          <div>
            <label class="form-label mb-1 small">Phone</label>
            <input v-model.trim="formPhone" class="form-control form-control-sm" />
          </div>

          <div>
            <label class="form-label mb-1 small">Address</label>
            <input v-model.trim="formAddress" class="form-control form-control-sm" required />
          </div>

          <div class="row g-2">
            <div class="col-6">
              <label class="form-label mb-1 small">Latitude</label>
              <input
                v-model.number="formLatitude"
                type="number"
                step="0.000001"
                class="form-control form-control-sm"
              />
            </div>
            <div class="col-6">
              <label class="form-label mb-1 small">Longitude</label>
              <input
                v-model.number="formLongitude"
                type="number"
                step="0.000001"
                class="form-control form-control-sm"
              />
            </div>
          </div>

          <button
            class="btn btn-sm btn-outline-secondary align-self-start"
            :disabled="isSavingRestaurant"
          >
            {{ isSavingRestaurant ? 'Saving...' : 'Save restaurant' }}
          </button>

          <p v-if="formMessage" class="text-muted small mb-0">{{ formMessage }}</p>
        </form>
      </section>
    </aside>
  </div>
</template>

<script setup>
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap'

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { authState as auth } from '../../stores/auth'
import db from '../../firebase/init.js' //
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'

// Mapbox
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'

// Small helper you already use
import { clampText } from '@/utils/validate'

// Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const statusMessage = ref('Locating you...')
const restaurantList = ref([])
const isAdmin = computed(() => auth.role === 'admin')

// Add form state
const formName = ref('')
const formPhone = ref('')
const formAddress = ref('')
const formLatitude = ref(null) // number | null
const formLongitude = ref(null) // number | null
const formMessage = ref('')
const isSavingRestaurant = ref(false)

// Map state
let mapInstance
let directionsControl
let userCoordinates = null // [lon, lat]
const mapMarkers = []
let userMarker = null
let unsubscribeRestaurants = null

// ----- Geolocation -----
function getUserLocationOnce() {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ coords: null, error: 'Geolocation not supported.' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ coords: pos.coords, error: null }),
      (err) => resolve({ coords: null, error: err.message }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  })
}

function drawUserMarker(lon, lat) {
  const el = document.createElement('div')
  el.style.width = '14px'
  el.style.height = '14px'
  el.style.borderRadius = '50%'
  el.style.background = '#1976d2'
  el.style.boxShadow = '0 0 0 3px rgba(25,118,210,0.3)'
  el.title = 'You are here'
  if (userMarker) userMarker.remove()
  userMarker = new mapboxgl.Marker({ element: el }).setLngLat([lon, lat]).addTo(mapInstance)
}

// ----- Firestore live listener -----
function startRestaurantsListener() {
  const q = query(collection(db, 'healthyRestaurants'), orderBy('name'))
  unsubscribeRestaurants = onSnapshot(
    q,
    (snap) => {
      restaurantList.value = snap.docs.map((doc) => {
        const data = doc.data() || {}
        return {
          id: doc.id,
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          location: data.location || null, // { lat, lng } | null
        }
      })
      refreshMarkers()
    },
    (err) => console.error('onSnapshot(healthyRestaurants) error:', err),
  )
}

function refreshMarkers() {
  // remove old markers
  mapMarkers.splice(0).forEach((m) => m.remove())

  // add markers for entries with coordinates
  for (const r of restaurantList.value) {
    if (!r.location || typeof r.location.lng !== 'number' || typeof r.location.lat !== 'number')
      continue
    const marker = new mapboxgl.Marker()
      .setLngLat([r.location.lng, r.location.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<b>${r.name}</b><br>${r.address}`))
      .addTo(mapInstance)
    mapMarkers.push(marker)
  }

  // Fit user + markers
  if (mapMarkers.length > 0 || userCoordinates) {
    const bounds = new mapboxgl.LngLatBounds()
    mapMarkers.forEach((m) => bounds.extend(m.getLngLat()))
    if (userCoordinates) bounds.extend(userCoordinates)
    if (!bounds.isEmpty()) mapInstance.fitBounds(bounds, { padding: 50, duration: 700 })
  }
}

// ----- Add restaurant (admin) -----
function validateRestaurantInputs() {
  if (!formName.value) return 'Name is required.'
  if (!formAddress.value) return 'Address is required.'
  const lat = formLatitude.value
  const lng = formLongitude.value
  const latSet = lat !== null && lat !== '' && !Number.isNaN(lat)
  const lngSet = lng !== null && lng !== '' && !Number.isNaN(lng)
  if (latSet !== lngSet) return 'Please provide both latitude and longitude, or leave both empty.'
  if (latSet) {
    if (lat < -90 || lat > 90) return 'Latitude must be between -90 and 90.'
    if (lng < -180 || lng > 180) return 'Longitude must be between -180 and 180.'
  }
  return null
}

async function addHealthyRestaurant() {
  formMessage.value = ''
  const errorText = validateRestaurantInputs()
  if (errorText) {
    formMessage.value = errorText
    return
  }

  try {
    isSavingRestaurant.value = true
    const uid = auth.uid || null

    const docData = {
      name: clampText(formName.value, 80),
      phone: clampText(formPhone.value, 40),
      address: clampText(formAddress.value, 120),
      location:
        formLatitude.value !== null && formLongitude.value !== null
          ? { lat: Number(formLatitude.value), lng: Number(formLongitude.value) }
          : null,
      createdAt: serverTimestamp(),
      createdBy: uid,
    }

    await addDoc(collection(db, 'healthyRestaurants'), docData)

    formMessage.value = 'Saved successfully.'
    formName.value = ''
    formPhone.value = ''
    formAddress.value = ''
    formLatitude.value = null
    formLongitude.value = null
  } catch (err) {
    console.error(err)
    formMessage.value = `Save failed: ${err?.message || String(err)}`
  } finally {
    isSavingRestaurant.value = false
  }
}

onMounted(async () => {
  // 1) get user location first
  const { coords, error } = await getUserLocationOnce()
  if (coords) {
    userCoordinates = [coords.longitude, coords.latitude]
    statusMessage.value = 'Location found.'
  } else {
    userCoordinates = [144.9631, -37.8136] // Melbourne CBD fallback
    statusMessage.value = `Could not get location (${error}). Using Melbourne CBD.`
  }

  // 2) init map + directions
  mapInstance = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: userCoordinates,
    zoom: 13,
  })
  mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')

  directionsControl = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    controls: { instructions: true },
  })
  mapInstance.addControl(directionsControl, 'top-left')
  directionsControl.setOrigin(userCoordinates)
  drawUserMarker(userCoordinates[0], userCoordinates[1])

  // 3) start listening to restaurants
  startRestaurantsListener()
})

onBeforeUnmount(() => {
  if (typeof unsubscribeRestaurants === 'function') unsubscribeRestaurants()
  mapInstance?.remove()
})

// ----- UI actions -----
function hasCoordinates(r) {
  return !!(r?.location && typeof r.location.lng === 'number' && typeof r.location.lat === 'number')
}

function locateRestaurant(restaurant) {
  if (!hasCoordinates(restaurant)) {
    alert('This restaurant has no coordinates yet.')
    return
  }
  mapInstance.flyTo({ center: [restaurant.location.lng, restaurant.location.lat], zoom: 15 })
}

function navigateToRestaurant(restaurant) {
  if (!userCoordinates) {
    alert('Your location is not available yet.')
    return
  }
  if (!hasCoordinates(restaurant)) {
    alert('This restaurant has no coordinates yet.')
    return
  }
  directionsControl.setOrigin(userCoordinates)
  directionsControl.setDestination([restaurant.location.lng, restaurant.location.lat])
}
</script>

<style scoped>
.map-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  height: 100vh;
}
#map {
  height: 100%;
}
.side-panel {
  padding: 12px;
  overflow: auto;
  border-left: 1px solid #eee;
}
</style>
