<!-- src/views/MapView.vue -->
<template>
  <div class="map-wrap">
    <div id="map"></div>
    <div id="geocoder-host" class="geocoder-host"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions'
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css'

const MEL_BBOX = [144.4, -38.6, 145.7, -37.3]
const COMPANY = {
  name: 'MyHealth Pty Ltd',
  address: '123 Fake Street, Melbourne VIC',
  coords: [144.965, -37.8135], // [lon, lat]
}

let map /*, geolocateCtrl, directionsCtrl, geocoderCtrl */

onMounted(() => {
  try {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!token) {
      console.error('Missing VITE_MAPBOX_TOKEN in .env')
      return
    }
    mapboxgl.accessToken = token

    //  Map
    map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [144.9631, -37.8136],
      zoom: 12,
    })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', () => {
      new mapboxgl.Marker({ color: '#ff5a5f' })
        .setLngLat(COMPANY.coords)
        .setPopup(
          new mapboxgl.Popup({ offset: 12 }).setHTML(
            `<strong>${COMPANY.name}</strong><br>${COMPANY.address}`,
          ),
        )
        .addTo(map)
    })
  } catch (err) {
    console.error('Map init error:', err)
  }
  // Geolocate
  const geolocateCtrl = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  })
  map.addControl(geolocateCtrl, 'top-right')

  // Directions
  const directionsCtrl = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric',
    profile: 'mapbox/driving',
    alternatives: true,
    geometries: 'geojson',
    controls: { instructions: true },
  })
  map.addControl(directionsCtrl, 'top-left')
  directionsCtrl.setDestination(COMPANY.coords) // fixed location (B)

  // Geocoder
  const geocoderCtrl = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    mapboxgl,
    placeholder: 'Enter your location (A)...',
    types: 'poi,place,address,street,locality,region,country',
    countries: 'AU',
    bbox: MEL_BBOX,
    proximity: [144.9631, -37.8136],
    marker: false,
    language: 'en',
    limit: 10,
  })
  const host = document.getElementById('geocoder-host')
  if (host) host.appendChild(geocoderCtrl.onAdd(map))
  else console.warn('#geocoder-host not found')

  // Events
  geolocateCtrl.on('geolocate', (e) => {
    const { longitude: lon, latitude: lat } = e.coords
    directionsCtrl.setOrigin([lon, lat]) // A
    map.flyTo({ center: [lon, lat], zoom: 14 })
  })
  geocoderCtrl.on('result', (ev) => {
    const [lon, lat] = ev?.result?.center || []
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      directionsCtrl.setOrigin([lon, lat]) // A
      map.flyTo({ center: [lon, lat], zoom: 15 })
    }
  })
  map.on('moveend', () => {
    const c = map.getCenter()
    geocoderCtrl.setProximity([c.lng, c.lat])
  })
})

onBeforeUnmount(() => {
  if (map) map.remove()
})
</script>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 100vh;
}
#map {
  width: 100%;
  height: 100%;
}
.geocoder-host {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
  width: 340px;
}
</style>
