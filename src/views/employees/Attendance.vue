<script setup>
import { ref, onMounted } from 'vue'
import { useEmployeeStore } from '../../store/employees'
import { useAttendanceStore } from '../../store/attendance'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import LoadingSpinner from '../../components/LoadingSpinner.vue'
import { 
  FingerprintIcon, 
  SparklesIcon,
  MapPinIcon
} from '@lucide/vue'

const employeeStore = useEmployeeStore()
const attendanceStore = useAttendanceStore()

const selectedEmployee = ref('')
const checkInStatus = ref('Ontime')
const isLoading = ref(true)

const triggerSimulatedCheckIn = async () => {
  if (!selectedEmployee.value) return
  await employeeStore.checkInEmployee(selectedEmployee.value, checkInStatus.value)
  selectedEmployee.value = '' // Reset
}

onMounted(async () => {
  try {
    isLoading.value = true
    await Promise.allSettled([
      employeeStore.loadEmployeesOnly(),
      employeeStore.loadAttendanceSummaryOnly()
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
            {{ employeeStore.employees.length || 0 }}
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
            {{ attendanceStore.todayAttendanceRate || 100 }}%
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

    <!-- MAIN TWO COLUMN WORKSPACE -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <!-- SIMULATE CHECK-IN FORM -->
      <section class="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between" aria-labelledby="sim-title">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h2 id="sim-title" class="font-display font-bold text-base text-slate-800 flex items-center gap-2">
              <FingerprintIcon class="size-4.5 text-emerald-600" aria-hidden="true" />
              <span>Simulasi Presensi GPS &amp; Selfie</span>
            </h2>
            <BaseBadge variant="success">API v1 Connected</BaseBadge>
          </div>
          <p class="text-xs text-slate-500 mb-6 leading-relaxed">
            Gunakan panel ini untuk mensimulasikan panggilan API Presensi Masuk (Check-In) karyawan secara langsung.
          </p>

          <form @submit.prevent="triggerSimulatedCheckIn" class="flex flex-col gap-4 text-xs font-sans">
            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Pilih Karyawan</label>
              <select v-model="selectedEmployee" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
                <option value="">-- Pilih Karyawan --</option>
                <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.name">
                  {{ emp.name }} ({{ emp.dept }})
                </option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Status Presensi</label>
              <select v-model="checkInStatus" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800">
                <option value="Ontime">Tepat Waktu (Ontime)</option>
                <option value="Late">Terlambat (Late)</option>
              </select>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5 text-slate-500 text-[11px]">
              <MapPinIcon class="size-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <span class="block font-bold text-slate-700 font-mono">Geofence Location:</span>
                <span>Kantor Pusat Jakarta (-6.2088, 106.8456) &bull; Radius Valid: 100m</span>
              </div>
            </div>

            <BaseButton variant="primary-emerald" type="submit" class="w-full justify-center mt-2">
              <FingerprintIcon class="size-4" aria-hidden="true" />
              <span>Kirim Simulasi Check-In API</span>
            </BaseButton>
          </form>
        </div>
      </section>

      <!-- LIVE ATTENDANCE AUDIT LOG STREAM -->
      <section class="lg:col-span-2 p-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm" aria-labelledby="stream-title">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 id="stream-title" class="font-display font-bold text-base text-slate-800">
              Live Audit Log Kehadiran Realtime
            </h2>
            <p class="text-xs text-slate-500 mt-0.5">Daftar presensi karyawan yang terverifikasi GPS hari ini.</p>
          </div>
          <span class="size-2.5 rounded-full bg-emerald-500 animate-pulse" title="Live Stream Active" aria-hidden="true"></span>
        </div>

        <div v-if="isLoading" class="py-12 flex justify-center">
          <LoadingSpinner />
        </div>

        <div v-else>
          <ul class="flex flex-col gap-2.5">
            <li 
              v-for="log in attendanceStore.attendanceLogs" 
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
            <li v-if="!attendanceStore.attendanceLogs.length" class="py-6 text-center text-slate-400 italic">
              Belum ada absensi terverifikasi hari ini.
            </li>
          </ul>
        </div>
      </section>
    </div>
  </main>
</template>
