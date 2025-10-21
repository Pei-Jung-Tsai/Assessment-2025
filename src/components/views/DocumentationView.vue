<template>
  <div class="container py-4">
    <h2 class="mb-1">API Documentation</h2>
    <p class="text-muted mb-4">
      Public REST endpoints for third-party access. Responses are JSON. No auth required.
    </p>

    <!-- Overview -->
    <div class="mb-4">
      <h5 class="mb-2">Overview</h5>
      <ul class="small text-muted mb-0">
        <li>Base: Firebase Cloud Functions (HTTPS)</li>
        <li>Methods: <code>GET</code> only</li>
        <li>CORS: enabled for public read</li>
      </ul>
    </div>

    <!-- Endpoints quick list -->
    <div class="mb-4">
      <h5 class="mb-2">Endpoints</h5>
      <ul class="list-unstyled">
        <li class="mb-1">
          <code class="me-2">GET</code>
          <a :href="restaurantsUrl" target="_blank" rel="noopener">{{ restaurantsUrl }}</a>
          <span class="text-muted"> - Healthy restaurants </span>
        </li>
        <li>
          <code class="me-2">GET</code>
          <a :href="recipesUrl" target="_blank" rel="noopener">{{ recipesUrl }}</a>
          <span class="text-muted"> - Recipes</span>
        </li>
      </ul>
    </div>

    <!-- Restaurants -->
    <section class="mb-5">
      <h5 class="mb-2">1) Healthy Restaurants</h5>
      <div class="card">
        <div class="card-body">
          <p class="mb-2">
            <strong>URL</strong><br />
            <a :href="restaurantsUrl" target="_blank" rel="noopener">{{ restaurantsUrl }}</a>
          </p>
          <p class="mb-2"><strong>Method</strong><br /><code>GET</code></p>
          <p class="mb-3">
            <strong>Purpose</strong><br />
            Returns a list of healthy restaurants from Firestore collection
            <code>healthyRestaurants</code>.
          </p>

          <div class="row g-3">
            <div class="col-md-6">
              <p class="mb-1 fw-semibold small">Sample Response</p>
              <pre class="bg-light p-2 small mb-0"><code>{
  "count": 2,
  "items": [
    {
      "id": "h7sYBt0ZrJ",
      "name": "Green Leaf Kitchen",
      "phone": "+61 3 9876 5432",
      "address": "253 Swanston St, Melbourne VIC 3000",
      "location": { "lat": -37.811, "lng": 144.964 }
    },
    {
      "id": "mQ9K2Yk89r",
      "name": "Clayton Clean Eats",
      "phone": "+61 3 9558 1200",
      "address": "630 Blackburn Rd, Clayton VIC 3168",
      "location": { "lat": -37.896, "lng": 145.145 }
    }
  ]
}</code></pre>
            </div>
            <div class="col-md-6">
              <p class="mb-1 fw-semibold small">Fetch Example</p>
              <pre class="bg-light p-2 small mb-0"><code>fetch('{{ restaurantsUrl }}')
  .then(r =&gt; r.json())
  .then(data =&gt; console.log(data))</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recipes -->
    <section class="mb-5">
      <h5 class="mb-2">2) Recipes</h5>
      <div class="card">
        <div class="card-body">
          <p class="mb-2">
            <strong>URL</strong><br />
            <a :href="recipesUrl" target="_blank" rel="noopener">{{ recipesUrl }}</a>
          </p>
          <p class="mb-2"><strong>Method</strong><br /><code>GET</code></p>
          <p class="mb-3">
            <strong>Purpose</strong><br />
            Returns a list of recipes from Firestore collection <code>recipes</code>.
          </p>

          <div class="row g-3">
            <div class="col-md-6">
              <p class="mb-1 fw-semibold small">Sample Response</p>
              <pre class="bg-light p-2 small mb-0"><code>{
  "count": 2,
  "items": [
    {
      "id": "aBc123xYz",
      "title": "Avocado Salad",
      "category": "Healthy Meal",
      "time": 10,
      "avgRating": 4.7
    },
    {
      "id": "b9P3rTy78",
      "title": "Oatmeal Smoothie",
      "category": "Breakfast",
      "time": 5,
      "avgRating": 4.9
    }
  ]
}</code></pre>
            </div>
            <div class="col-md-6">
              <p class="mb-1 fw-semibold small">Fetch Example</p>
              <pre class="bg-light p-2 small mb-0"><code>fetch('{{ recipesUrl }}')
  .then(r =&gt; r.json())
  .then(data =&gt; console.log(data))</code></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Summary -->
    <div class="alert alert-light border small">
      These endpoints follow REST and are publicly accessible via <code>GET</code>. Third parties
      can integrate our data by calling the URLs above.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const restaurantsUrl = computed(() => 'https://restaurants-dnedbvyhva-ts.a.run.app')
const recipesUrl = computed(() => 'https://recipes-dnedbvyhva-ts.a.run.app')
</script>
