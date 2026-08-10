<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  LayoutDashboardIcon, 
  UserIcon, 
  MapPinIcon,
  Building2Icon,
  BriefcaseIcon,
  FileTextIcon,
  CalendarDaysIcon, 
  ClockIcon, 
  SparklesIcon, 
  CalendarIcon,
  TimerIcon,
  CreditCardIcon, 
  ShieldCheckIcon,
  TargetIcon, 
  UsersIcon,
  LogOutIcon,
  SunIcon,
  MoonIcon,
  SmartphoneIcon
} from '@lucide/vue'
import { useAuthStore } from '../store/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isDarkMode = ref(false)

const handleLogout = () => {
  authStore.logoutAction()
  router.push({ name: 'Login' })
}
</script>

<template>
  <aside 
    class="w-64 p-3 h-screen sticky top-0 overscroll-none select-none font-sans shrink-0 flex flex-col justify-between"
    aria-label="Navigasi HRIS"
  >
    <!-- Floating White Sidebar Card Container -->
    <div class="bg-white rounded-2xl p-4 border border-slate-100/80 shadow-xs flex flex-col h-full overflow-y-auto">
      
      <!-- Top Logo Header -->
      <div class="flex items-center gap-2 px-2 mb-5">
        <div class="flex items-center gap-1">
          <span class="size-2 rounded-full bg-[#3b52f6]"></span>
          <span class="size-2 rounded-full bg-[#3b52f6]"></span>
        </div>
        <span class="font-black text-xl tracking-tight text-slate-900 font-display">
          Apex HRIS
        </span>
      </div>

      <!-- Navigation Section -->
      <nav class="flex-1 space-y-5" aria-label="Menu Utama">
        <!-- Main Menu Items -->
        <div class="space-y-0.5">
          <RouterLink
            to="/dashboard"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/dashboard' || route.path === '/'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <LayoutDashboardIcon class="size-4 shrink-0" />
            <span>Dashboard</span>
          </RouterLink>
        </div>

        <!-- Human Resource Group -->
        <div class="space-y-0.5">
          <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Human Resource
          </span>

          <RouterLink
            to="/employees?tab=employees"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees' && (route.query.tab === 'employees' || !route.query.tab)
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <UserIcon class="size-4 shrink-0" />
            <span>Employee Directory</span>
          </RouterLink>

          <RouterLink
            to="/employees?tab=locations"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees' && route.query.tab === 'locations'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <MapPinIcon class="size-4 shrink-0" />
            <span>Office Locations</span>
          </RouterLink>

          <RouterLink
            to="/employees?tab=departments"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees' && route.query.tab === 'departments'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <Building2Icon class="size-4 shrink-0" />
            <span>Departments</span>
          </RouterLink>

          <RouterLink
            to="/employees?tab=positions"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees' && route.query.tab === 'positions'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <BriefcaseIcon class="size-4 shrink-0" />
            <span>Positions</span>
          </RouterLink>

          <RouterLink
            to="/employees/contracts"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/contracts'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <FileTextIcon class="size-4 shrink-0" />
            <span>Contracts (PKWT)</span>
          </RouterLink>
        </div>

        <!-- Attendance & Workforce Group -->
        <div class="space-y-0.5">
          <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Workforce &amp; Time
          </span>

          <RouterLink
            to="/employees/attendance"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/attendance'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <CalendarDaysIcon class="size-4 shrink-0" />
            <span>Attendance Logs</span>
          </RouterLink>

          <RouterLink
            to="/employees/shifts"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path.startsWith('/employees/shifts')
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <ClockIcon class="size-4 shrink-0" />
            <span>Shift &amp; Roster</span>
          </RouterLink>

          <RouterLink
            to="/employees/leaves"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/leaves'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <SparklesIcon class="size-4 shrink-0" />
            <span>Leave Management</span>
          </RouterLink>

          <RouterLink
            to="/employees/leaves/holidays"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/leaves/holidays'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <CalendarIcon class="size-4 shrink-0" />
            <span>Public Holidays</span>
          </RouterLink>

          <RouterLink
            to="/payroll/overtime"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path.startsWith('/payroll/overtime')
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <TimerIcon class="size-4 shrink-0" />
            <span>Overtime Claims</span>
          </RouterLink>
        </div>

        <!-- Payroll & Performance Group -->
        <div class="space-y-0.5">
          <span class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
            Finance &amp; Audit
          </span>

          <RouterLink
            to="/payroll"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/payroll'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <CreditCardIcon class="size-4 shrink-0" />
            <span>Payroll Engine</span>
          </RouterLink>

          <RouterLink
            to="/employees/kpi"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/kpi'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <TargetIcon class="size-4 shrink-0" />
            <span>KPI Scorecards</span>
          </RouterLink>

          <RouterLink
            to="/employees/recruitment"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/employees/recruitment'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <UsersIcon class="size-4 shrink-0" />
            <span>Recruitment Funnel</span>
          </RouterLink>

          <RouterLink
            to="/audit-logs"
            class="flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            :class="[
              route.path === '/audit-logs'
                ? 'bg-[#3b52f6] text-white shadow-sm shadow-[#3b52f6]/30'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            ]"
          >
            <ShieldCheckIcon class="size-4 shrink-0" />
            <span>Audit Logs</span>
          </RouterLink>
        </div>
      </nav>

      <!-- Bottom Controls: Theme Toggle & Logout -->
      <div class="pt-3 mt-auto border-t border-slate-100 space-y-3">
        <!-- Light / Dark Mode Toggle Pill -->
        <div class="bg-slate-100/80 p-1 rounded-full flex items-center justify-between">
          <button 
            @click="isDarkMode = false"
            class="flex-1 py-1 rounded-full flex items-center justify-center transition-all cursor-pointer"
            :class="!isDarkMode ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400'"
          >
            <SunIcon class="size-3.5" />
          </button>
          <button 
            @click="isDarkMode = true"
            class="flex-1 py-1 rounded-full flex items-center justify-center transition-all cursor-pointer"
            :class="isDarkMode ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-400'"
          >
            <MoonIcon class="size-3.5" />
          </button>
        </div>

        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
        >
          <LogOutIcon class="size-4 shrink-0 text-slate-400" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  </aside>
</template>
