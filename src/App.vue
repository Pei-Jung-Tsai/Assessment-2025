<script setup>
import TopNav from './components/TopNav.vue'
</script>

<template>
  <!--  Skip link for keyboard users
       Allows users using Tab or screen readers to skip navigation and jump directly to main content.
        -->
  <a href="#main-content" class="skip-link">Skip to main content</a>

  <!--  Site header landmark (for screen reader navigation)
       Provides a landmark so screen readers know this is the header/banner section.
        -->
  <header role="banner">
    <TopNav />
  </header>

  <!--  Decorative top image with alt text for accessibility
        -->
  <section class="top-pic position-relative">
    <img src="@/assets/TopPic.avif" alt="Healthy food" class="img-fluid w-100" />
  </section>

  <!--  Main content area landmark
       Helps screen readers jump directly to the main section of the page.
       -->
  <main id="main-content" role="main" class="container py-4">
    <router-view />
  </main>
</template>

<style scoped>
/* Skip link style: hidden by default, visible when focused.*/
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: #ffffff;
  color: #000;
  padding: 8px 12px;
  z-index: 1000;
  border-radius: 6px;
  box-shadow: none;
}

/* Make skip link visible when Tabbed into.*/
.skip-link:focus {
  left: 12px;
  top: 12px;
  box-shadow: 0 0 0 3px #ffd54f;
}

/*  Global focus indicator: visible outline when element is focused.*/
:global(:focus) {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
