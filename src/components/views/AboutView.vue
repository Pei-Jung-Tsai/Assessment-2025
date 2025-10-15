<template>
  <template>
    <div class="layout">
      <!-- Top toolbar -->
      <div class="toolbar">
        <button @click="searchNearbyHealthyRestaurants" :disabled="isLoading">
          {{ isLoading ? 'Searching…' : 'Search nearby healthy restaurants' }}
        </button>
        <span v-if="errorMessage" class="error">{{ errorMessage }}</span>
      </div>
      <!-- Left results list -->
      <aside class="sidebar">
        <h3>Results ({{ placesOfInterest.length }})</h3>
        <ul>
          <li
            v-for="(place, index) in placesOfInterest"
            :key="place.id"
            :class="{ active: index === selectedIndex }"
            @click="focusOnPlace(index)"
          >
            <div class="name">{{ place.text }}</div>
            <div class="address">{{ place.place_name }}</div>
            <div class="distance" v-if="place._distanceText">~ {{ place._distanceText }}</div>
          </li>
        </ul>
      </aside>
      <!-- Map -->
      <div id="map" />
    </div>
  </template>

  <script setup>
    import { onMounted, onBeforeUnmount } from 'vue'
    import mapboxgl from 'mapbox-gl'
    import 'mapbox-gl/dist/mapbox-gl.css'
    import { ref } from 'vue'

    const isLoading = ref(false) // true while calling the search API
    const errorMessage = ref('') // show a short message if something fails
    const placesOfInterest = ref([]) // POIs returned from Geocoding API
    const selectedIndex = ref(-1) // which list item is selected

    let mapMarkers = [] // Marker instances on the map
    let userCoordinates = null // [lon, lat] from browser location
    let map

    // Create the map when the component loads
    onMounted(() => {
      map = new mapboxgl.Map({
        container: 'map', // connect to the template <div id="map">
        style: 'mapbox://styles/mapbox/streets-v12', // basic street style
        center: [144.9631, -37.8136], // melbourne city for start
        zoom: 11,
        accessToken: import.meta.env.VITE_MAPBOX_TOKEN, // use token from .env
      })

      // Add zoom & rotate buttons (top-right corner)
      map.addControl(new mapboxgl.NavigationControl(), 'top-right')

      // Add "locate me" button (auto move to user location when allowed)
      map.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true }, // use GPS if available
          trackUserLocation: true, // target user's location
          showUserHeading: true, // show direction arrow
        }),
        'top-right',
      )
    })

    // Clean up map when leaving the page
    onBeforeUnmount(() => {
      if (map) map.remove()
    })
  </script>

  <style scoped>
    /* Make the map fill the entire viewport */
    #map {
      width: 100%;
      height: 100vh;
    }
  </style>
</template>
