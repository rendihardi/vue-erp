<script setup>
import { ref, onMounted } from 'vue'
import { useErpStore } from '../../../store/erp'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'
import { SlidersIcon, UserIcon, CalendarIcon, ClockIcon, CheckCircle2Icon, RefreshCwIcon, AlertCircleIcon } from '@lucide/vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'
import * as api from '../../../api'

const erpStore = useErpStore()

const isLoading = ref(false)
const isSubmitting = ref(false)

// Form Adjustment State
const form = ref({
  employee_ids: [],
  start_date: new Date().toISOString().split('T')[0],
  end_date: new Date().toISOString().split('T')[0],
  shift_id: '',
  is_day_off: false,
  notes: ''
})

const resetForm = () => {
  form.value = {
    employee_ids: [],
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    shift_id: '',
    is_day_off: false,
    notes: ''
  }
}

const toggleEmployeeSelection = (empId) => {
  const current = [...form.value.employee_ids]
  const idx = current.indexOf(empId)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(empId)
  }
  form.value.employee_ids = current
}

const selectAllEmployees = () => {
  if (form.value.employee_ids.length === erpStore.employees.length) {
    form.value.employee_ids = []
  } else {
    form.value.employee_ids = erpStore.employees.map(e => e.id)
  }
}

const handleSaveAdjustment = async () => {
  if (form.value.employee_ids.length === 0) {
    showToastWarning('Harap pilih minimal 1 karyawan untuk penyesuaian jadwal!')
    return
  }
  if (!form.value.start_date || !form.value.end_date) {
    showToastWarning('Harap tentukan tanggal mulai dan selesai!')
    return
  }
  if (!form.value.is_day_off && !form.value.shift_id) {
    showToastWarning('Harap pilih shift pengganti atau centang Set sebagai Hari Libur (OFF)!')
    return
  }

  try {
    isSubmitting.value = true
    const payload = {
      employee_ids: form.value.employee_ids,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      shift_id: form.value.is_day_off ? null : form.value.shift_id,
      is_day_off: form.value.is_day_off,
      notes: form.value.notes || 'Manual Schedule Adjustment / Override via Tab Penyesuaian'
    }

    const res = await erpStore.assignRosterAction(payload)
    if (res && res.success) {
      showToastSuccess(`✅ Penyesuaian jadwal harian untuk ${form.value.employee_ids.length} karyawan berhasil diterapkan!`)
      resetForm()
    } else {
      showToastError(res?.message || 'Gagal menerapkan penyesuaian jadwal.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (!erpStore.employees || !erpStore.employees.length) {
    await erpStore.loadEmployeesOnly()
  }
  if (!erpStore.shifts || !erpStore.shifts.length) {
    await erpStore.fetchShiftsOnlyAction()
  }
})
</script>

<template>
  <div class="space-y-5 font-sans">
    <!-- HEADER SECTION -->
    <div class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md mb-1.5 font-mono">
          API: PUT /api/v1/rosters/schedules/{id}
        </div>
        <h2 class="font-bold text-base text-slate-900 flex items-center gap-2">
          <SlidersIcon class="size-4 text-slate-700" />
          <span>Penyesuaian Jadwal Harian (Schedule Adjustments &amp; Override)</span>
        </h2>
        <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Lakukan override atau penyesuaian manual shift harian karyawan (penukaran shift mendadak, tugas lembur khusus, atau penetapan hari libur khusus).
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <BaseButton variant="secondary" @click="resetForm" class="!py-1.5 !px-3">
          <RefreshCwIcon class="size-3.5 text-slate-600" />
          <span>Reset Form</span>
        </BaseButton>
      </div>
    </div>

    <!-- TWO-COLUMN LAYOUT -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- COLUMN 1: FORM SCHEDULE ADJUSTMENT -->
      <div class="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs h-fit space-y-4">
        <div class="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800">
            Form Penyesuaian Jadwal
          </h3>
          <span class="text-[11px] font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {{ form.employee_ids.length }} Terpilih
          </span>
        </div>

        <form @submit.prevent="handleSaveAdjustment" class="space-y-4 text-xs">
          <!-- Multi Employee Selector -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block font-semibold text-slate-700 text-xs">Pilih Karyawan <span class="text-rose-600">*</span></label>
              <button type="button" @click="selectAllEmployees" class="text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline">
                {{ form.employee_ids.length === erpStore.employees.length ? 'Batal Semua' : 'Pilih Semua' }}
              </button>
            </div>

            <div class="max-h-44 overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-1 divide-y divide-slate-100">
              <label
                v-for="emp in erpStore.employees"
                :key="emp.id"
                class="flex items-center justify-between p-1.5 hover:bg-white rounded cursor-pointer transition-colors pt-1.5"
              >
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="form.employee_ids.includes(emp.id)"
                    @change="toggleEmployeeSelection(emp.id)"
                    class="accent-slate-900 size-3.5"
                  />
                  <div>
                    <span class="block font-semibold text-slate-900 text-xs">{{ emp.name }}</span>
                    <span class="block text-[11px] text-slate-500 font-mono">{{ emp.nik }} &bull; {{ emp.dept }}</span>
                  </div>
                </div>
                <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border" :class="emp.shiftMode === 'roster' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'">
                  {{ emp.shiftMode.toUpperCase() }}
                </span>
              </label>
            </div>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 text-xs mb-1">Tanggal Mulai <span class="text-rose-600">*</span></label>
              <input v-model="form.start_date" required type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 text-xs mb-1">Tanggal Selesai <span class="text-rose-600">*</span></label>
              <input v-model="form.end_date" required type="date" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800" />
            </div>
          </div>

          <!-- Day Off Toggle -->
          <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span class="block font-semibold text-slate-900 text-xs">Set Hari Libur (OFF)</span>
              <span class="block text-[11px] text-slate-500">Karyawan tidak ditugaskan shift kerja</span>
            </div>
            <input type="checkbox" v-model="form.is_day_off" class="accent-slate-900 size-4 cursor-pointer" />
          </div>

          <!-- Shift Selection (If Not Day Off) -->
          <div v-if="!form.is_day_off">
            <label class="block font-semibold text-slate-700 text-xs mb-1">Pilih Shift Pengganti <span class="text-rose-600">*</span></label>
            <select v-model="form.shift_id" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium">
              <option value="">-- Pilih Shift Kerja --</option>
              <option v-for="sf in erpStore.shifts" :key="sf.id" :value="sf.id">
                {{ sf.name }} ({{ sf.startTime }} - {{ sf.endTime }})
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1">Catatan Penyesuaian</label>
            <textarea v-model="form.notes" rows="2" placeholder="Contoh: Tugas lembur proyek khusus / pertukaran shift..." class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none font-medium"></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <BaseButton variant="secondary" type="button" @click="resetForm">
              Batal
            </BaseButton>
            <BaseButton variant="primary-slate" type="submit" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Terapkan...' : 'Terapkan Penyesuaian' }}</span>
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- COLUMN 2: INFORMASI & PANDUAN ADJUSMENT -->
      <div class="lg:col-span-2 space-y-5">
        <!-- Guidelines Card -->
        <div class="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 class="font-bold text-xs uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <AlertCircleIcon class="size-4 text-slate-700" />
            <span>Panduan &amp; Ketentuan Schedule Adjustment</span>
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h4 class="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2Icon class="size-3.5 text-emerald-600" />
                <span>Override Fixed &amp; Roster Shift</span>
              </h4>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Mengubah shift harian karyawan Fixed maupun Roster secara instan tanpa merusak master pola kerja perusahaan.
              </p>
            </div>

            <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <h4 class="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                <CheckCircle2Icon class="size-3.5 text-emerald-600" />
                <span>Sinkronisasi Mesin Absensi &amp; App</span>
              </h4>
              <p class="text-[11px] text-slate-500 leading-relaxed">
                Setiap perubahan shift akan langsung tersinkron ke mesin absensi &amp; mobile app karyawan pada tanggal terkait.
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Matrix adjustment shortcut -->
        <div class="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <h4 class="font-bold text-slate-900 text-xs">Penyesuaian via Kalender Matriks Tim</h4>
            <p class="text-[11px] text-slate-500 mt-0.5">Anda juga dapat mengeklik sel tanggal pada Kalender Matriks Tim Shift di Tab Shift Team atau Roster Plan.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
