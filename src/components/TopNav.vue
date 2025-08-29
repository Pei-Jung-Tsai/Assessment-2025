<template>
  <div class="container">
    <header class="d-flex align-items-center justify-content-between py-3">
      <!-- Press OrgLogo back to Home Page -->
      <a href="/" class="logo-link fw-bold text-decoration-none text-dark">OrgLogo</a>
      <!-- Main NavigationBar to other pages -->
      <nav aria-label="Primary navigation">
        <ul class="nav nav-pills flex-wrap gap-2">
          <li class="nav-item"><a class="nav-link" href="#">About Us</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Services &amp; Resources</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Get Involved</a></li>
          <li class="nav-item"><a class="nav-link" href="#">News &amp; Updates</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Contact Us</a></li>
          <li class="nav-item"><a class="nav-link" href="#">Log In</a></li>
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
