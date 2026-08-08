<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '../store/erp'
import { 
  BellIcon, 
  SearchIcon, 
  UserIcon,
  CalendarIcon,
  LogOutIcon,
  ChevronDownIcon
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const erpStore = useErpStore()

const pageTitle = computed(() => {
  if (route.path === '/employees') return 'Employee Management'
  if (route.path === '/employees/shifts') return 'Workforce Shifts & Roster'
  if (route.path === '/employees/leaves') return 'Leave Management'
  if (route.path === '/payroll') return 'Payroll Calculation Engine'
  return 'Apex ERP Workspace'
})

const todayDate = computed(() => {
  const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
  return new Date().toLocaleDateString('en-US', options)
})

const handleLogout = () => {
  erpStore.logoutAction()
  router.push({ name: 'Login' })
}
</script>

<template>
  <header 
    class="h-16 bg-transparent flex items-center justify-between px-6 sticky top-0 z-30 overscroll-none shrink-0"
    role="banner"
  >
    <!-- Search Bar in floating white pill -->
    <div class="relative hidden sm:block flex-1 max-w-md">
      <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" aria-hidden="true">
        <SearchIcon class="size-4 text-slate-400" />
      </span>
      <input
        type="text"
        placeholder="Search here..."
        class="w-full bg-white border border-slate-100 hover:border-slate-200 text-xs font-medium text-slate-800 pl-10 pr-10 py-2.5 rounded-2xl shadow-xs focus:outline-none focus:border-[#3b52f6] transition-all"
        aria-label="Search HRIS"
      />
      <kbd class="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-400 font-mono">
        ⌘K
      </kbd>
    </div>

    <!-- Right Controls: Notification, Calendar, User Profile -->
    <div class="flex items-center gap-4 ml-auto">
      <!-- Notification Icon with Badge Count -->
      <button
        type="button"
        class="size-10 rounded-2xl bg-white border border-slate-100 shadow-xs text-slate-600 hover:text-[#3b52f6] flex items-center justify-center transition-colors relative cursor-pointer"
        aria-label="Notifications"
      >
        <BellIcon class="size-4.5" aria-hidden="true" />
        <span class="absolute -top-1 -right-1 size-4 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
          4
        </span>
      </button>

      <!-- Calendar Button -->
      <button
        type="button"
        class="size-10 rounded-2xl bg-white border border-slate-100 shadow-xs text-slate-600 hover:text-[#3b52f6] flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Calendar"
      >
        <CalendarIcon class="size-4.5" aria-hidden="true" />
      </button>

      <!-- User Profile Pill -->
      <div class="flex items-center gap-3 bg-white border border-slate-100 shadow-xs rounded-2xl px-3 py-1.5 cursor-pointer">
        <div class="size-8 rounded-full bg-[#3b52f6]/10 border border-[#3b52f6]/20 flex items-center justify-center text-[#3b52f6] font-bold text-xs font-mono shrink-0">
          SH
        </div>
        <div class="hidden sm:block text-left">
          <span class="block text-xs font-bold text-slate-900 leading-tight">Samuel Henry</span>
          <span class="block text-[10px] text-slate-400 font-medium leading-tight">HR Manager</span>
        </div>
        <ChevronDownIcon class="size-3.5 text-slate-400 hidden sm:block" />
      </div>
    </div>
  </header>
</template>
