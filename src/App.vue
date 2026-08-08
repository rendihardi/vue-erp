<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'

const route = useRoute()

// Check if we are on the Central Portal page or Login page
const isPortalOrLogin = computed(() => route.path === '/' || route.path === '/login')
</script>

<template>
  <div class="flex min-h-screen bg-[#f3f4f9] text-slate-900 font-sans h-screen overflow-hidden overscroll-none">
    <!-- Skip to main content link for Accessibility -->
    <a 
      href="#main-content" 
      class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:bg-emerald-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold focus:z-50 focus:outline-none"
    >
      Loncat ke konten utama
    </a>

    <!-- Render Sidebar ONLY if NOT on Central Portal or Login page -->
    <Sidebar v-if="!isPortalOrLogin" />

    <!-- Main Workspace Container -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- Render Header ONLY if NOT on Central Portal or Login page -->
      <Header v-if="!isPortalOrLogin" />

      <!-- Main route content loaded dynamically with fade animations -->
      <div class="flex-1 overflow-hidden h-full">
        <RouterView v-slot="{ Component }">
          <transition 
            name="fade" 
            mode="out-in"
          >
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </div>
  </div>
</template>

<style>
/* Page route animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms cubic-bezier(0.16, 1, 0.3, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
