<script setup>
import { ref, onMounted } from 'vue'
import { useErpStore } from '../../store/erp'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { 
  FingerprintIcon, 
  SparklesIcon,
  MapPinIcon
} from '@lucide/vue'

const erpStore = useErpStore()

const selectedEmployee = ref('')
const checkInStatus = ref('Ontime')
const isLoading = ref(true)

const triggerSimulatedCheckIn = async () => {
  if (!selectedEmployee.value) return
  await erpStore.checkInEmployee(selectedEmployee.value, checkInStatus.value)
  selectedEmployee.value = '' // Reset
}

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.allSettled([
      erpStore.loadEmployeesOnly(),
      erpStore.loadAttendanceSummaryOnly()
    ])
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- HEADER -->
    <div class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Attendance module Active
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Log & Simulasi Kehadiran
        </h1>
        <p class="text-xs text-slate-500">
          Uji simulasi kehadiran pencocokan wajah FastAPI (InsightFace) & pantau data kehadiran harian karyawan.
        </p>
      </div>
    </div>

    <!-- STATS ROW -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="p-5 rounded-2xl border border-slate-100/80 bg-white flex items-center justify-between shadow-xs">
        <div>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Total Karyawan</span>
          <span class="block font-black text-2xl text-slate-900 tracking-tight font-display">
            {{ erpStore.totalEmployees }}
          </span>
        </div>
        <div class="size-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
          <FingerprintIcon class="size-5" />
        </div>
      </div>

      <div class="p-5 rounded-2xl border border-slate-100/80 bg-white flex items-center justify-between shadow-xs">
        <div>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Rasio Kehadiran Hari Ini</span>
          <span class="block font-black text-2xl text-emerald-600 tracking-tight font-display">
            {{ erpStore.todayAttendanceRate }}%
          </span>
        </div>
        <div class="size-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <FingerprintIcon class="size-5" />
        </div>
      </div>

      <div class="p-5 rounded-2xl border border-slate-100/80 bg-white flex items-center justify-between shadow-xs">
        <div>
          <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">Geofence Radius</span>
          <span class="block font-black text-2xl text-slate-900 tracking-tight font-display">100m</span>
        </div>
        <div class="size-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
          <MapPinIcon class="size-5" />
        </div>
      </div>
    </div>

    <!-- LIVE FEED -->
    <div class="w-full mt-6">
      <!-- Live Feed -->
      <section class="p-6 rounded-2xl border border-slate-100/80 bg-white flex flex-col min-h-[320px] shadow-xs">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
            <div class="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Log Absensi Terverifikasi Geofence</span>
          </h2>
          <span class="text-[10px] text-slate-400 font-bold uppercase font-mono tracking-wider">FastAPI matching online</span>
        </div>

        <!-- Feed List -->
        <div class="flex-1 overflow-y-auto max-h-[350px]">
          <!-- Loading state -->
          <div v-if="isLoading" class="flex flex-col gap-2.5">
            <div 
              v-for="i in 4" 
              :key="i"
              class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 animate-pulse"
            >
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-lg bg-slate-200/70"></div>
                <div class="flex flex-col gap-1.5">
                  <div class="h-3 w-28 bg-slate-200/70 rounded-md"></div>
                  <div class="h-2.5 w-16 bg-slate-200/50 rounded-md"></div>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex flex-col gap-1.5 items-end">
                  <div class="h-3 w-32 bg-slate-200/70 rounded-md"></div>
                  <div class="h-2.5 w-20 bg-slate-200/50 rounded-md"></div>
                </div>
                <div class="h-5 w-14 bg-slate-200/70 rounded-full"></div>
              </div>
            </div>
          </div>
          <!-- Data state -->
          <ul v-else class="flex flex-col gap-2.5">
            <li 
              v-for="log in erpStore.attendanceLogs" 
              :key="log.id"
              class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div class="flex items-center gap-3">
                <div class="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-display font-bold text-xs text-slate-500 shadow-sm">
                  {{ log.name.split(' ').map(n => n[0]).join('') }}
                </div>
                <div>
                  <span class="block font-bold text-slate-700">{{ log.name }}</span>
                  <span class="block text-[10px] text-slate-400 font-medium">{{ log.dept }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between sm:justify-end gap-6">
                <div class="text-right">
                  <span class="block font-mono text-slate-700 font-bold">Jam Masuk: {{ log.checkIn }}</span>
                  <span class="block text-[9px] text-slate-400 font-mono">{{ log.coord }}</span>
                </div>

                <BaseBadge :variant="log.status === 'Ontime' ? 'success' : 'warning'">
                  {{ log.status }}
                </BaseBadge>
              </div>
            </li>
            <li v-if="!erpStore.attendanceLogs.length" class="py-6 text-center text-slate-400 italic">
              Belum ada absensi terverifikasi hari ini.
            </li>
          </ul>
        </div>
      </section>
    </div>
  </main>
</template>
