<script setup></script>

<template>
  <div class="container">
    <header class="d-flex align-items-center justify-content-between py-3">
      <!-- Press OrgLogo back to Home Page -->
      <router-link to="/home" class="logo-link fw-bold text-decoration-none text-dark">
        OrgLogo
      </router-link>
      <!-- Main NavigationBar to other pages -->
      <nav aria-label="Primary navigation">
        <ul class="nav nav-pills flex-wrap gap-2">
          <li class="nav-item">
            <router-link to="/about" class="nav-link">About</router-link>
          </li>
          <li class="nav-item">
            <router-link to="/login" class="nav-link">Log In</router-link>
          </li>
        </ul>
      </nav>
    </header>
  </div>
</template>

<style scoped>
.nav-link {
  color: #155724;
}

.nav-link:hover {
  color: #3cb371;
}
</style>
