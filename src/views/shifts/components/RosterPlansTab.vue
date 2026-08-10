<script setup>
import { ref, watch, onMounted } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'
import BasePagination from '../../../components/BasePagination.vue'
import { CalendarDaysIcon, PlusIcon, EyeIcon, SearchIcon, TrashIcon, XIcon } from '@lucide/vue'
import { confirmAction } from '../../../utils/swal'
import { showToastSuccess, showToastError } from '../../../utils/toast'

import ScheduleAdjustmentModal from './ScheduleAdjustmentModal.vue'

const shiftsStore = useShiftsStore()

const emit = defineEmits([
  'open-create-plan',
  'open-edit-plan',
  'generate-plan',
  'validate-plan',
  'publish-plan',
  'lock-plan',
  'open-matrix-calendar'
])

const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const isSearching = ref(false)

const selectedPlan = ref(null)
const showEntriesModal = ref(false)
const isLoadingEntries = ref(false)
const planEntries = ref([])
const entriesMeta = ref({ page: 1, last_page: 1, total: 0 })

const showAdjustmentModal = ref(false)
const editingSchedule = ref(null)

const openAdjustmentModal = (sc) => {
  editingSchedule.value = sc
  showAdjustmentModal.value = true
}

const handleScheduleAdjusted = () => {
  fetchEntriesPage(entriesMeta.value.page || entriesMeta.value.current_page || 1)
}

const fetchFilteredPlans = async (page = 1) => {
  currentPage.value = page
  try {
    isSearching.value = true
    await shiftsStore.fetchRosterPlansFilteredAction({
      page: currentPage.value,
      per_page: 9,
      search: searchQuery.value,
      status: statusFilter.value
    })
  } catch (err) {
    showToastError('Gagal memuat Roster Plan: ' + err.message)
  } finally {
    isSearching.value = false
  }
}

watch([searchQuery, statusFilter], () => {
  fetchFilteredPlans(1)
})

onMounted(() => {
  fetchFilteredPlans(1)
})

const handleDeletePlan = async (plan) => {
  if (plan.status === 'locked') {
    showToastError('Roster Plan yang sudah dikunci (Locked) tidak dapat dihapus!')
    return
  }

  const isConfirmed = await confirmAction({
    title: `Hapus Roster Plan '${plan.name}'?`,
    text: 'Roster Plan dan seluruh entri jadwal harian terkait akan dihapus permanen.',
    confirmButtonText: 'Ya, Hapus Roster Plan',
    icon: 'error'
  })
  if (!isConfirmed) return

  try {
    const res = await shiftsStore.deleteRosterPlanAction(plan.id)
    if (res && res.success) {
      showToastSuccess(`🗑️ Roster Plan '${plan.name}' berhasil dihapus!`)
      fetchFilteredPlans(currentPage.value)
    } else {
      showToastError(res?.message || 'Gagal menghapus Roster Plan')
    }
  } catch (err) {
    showToastError('Error menghapus Roster Plan: ' + err.message)
  }
}

const entrySearchQuery = ref('')
const entryStartDate = ref('')
const entryEndDate = ref('')

const viewPlanEntries = async (plan) => {
  selectedPlan.value = plan
  entrySearchQuery.value = ''
  entryStartDate.value = ''
  entryEndDate.value = ''
  showEntriesModal.value = true
  await fetchEntriesPage(1)
}

const fetchEntriesPage = async (page = 1) => {
  if (!selectedPlan.value) return
  try {
    isLoadingEntries.value = true
    const params = {
      roster_plan_id: selectedPlan.value.id
    }
    if (entrySearchQuery.value.trim()) {
      params.search = entrySearchQuery.value.trim()
    }
    if (entryStartDate.value) {
      params.start_date = entryStartDate.value
    }
    if (entryEndDate.value) {
      params.end_date = entryEndDate.value
    }

    const res = await shiftsStore.fetchRosters(page, 15, params)
    if (res && res.success && res.data) {
      const items = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
      
      // Client-side filtering fallback for exact responsive UI
      let filtered = items
      if (entrySearchQuery.value.trim()) {
        const q = entrySearchQuery.value.toLowerCase()
        filtered = filtered.filter(item => {
          const empName = (item.employee?.name || item.employee_name || '').toLowerCase()
          const empNik = (item.employee?.nik || item.employee_code || '').toLowerCase()
          return empName.includes(q) || empNik.includes(q)
        })
      }
      if (entryStartDate.value) {
        filtered = filtered.filter(item => item.date >= entryStartDate.value)
      }
      if (entryEndDate.value) {
        filtered = filtered.filter(item => item.date <= entryEndDate.value)
      }

      planEntries.value = filtered
      if (res.data.meta) {
        entriesMeta.value = res.data.meta
      } else {
        entriesMeta.value = { page, last_page: 1, total: filtered.length }
      }
    }
  } catch (err) {
    console.error('Failed to load roster entries:', err.message)
  } finally {
    isLoadingEntries.value = false
  }
}

const resetEntryFilters = () => {
  entrySearchQuery.value = ''
  entryStartDate.value = ''
  entryEndDate.value = ''
  fetchEntriesPage(1)
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr.split('T')[0] || dateStr
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch (err) {
    return dateStr
  }
}
</script>

<template>
  <div class="space-y-5 font-sans">
    <!-- Header Section -->
    <div class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md mb-1.5 font-mono">
          Roster Period Management
        </div>
        <h2 class="font-bold text-base text-slate-900">Roster Plan Period Containers</h2>
        <p class="text-xs text-slate-500 mt-1 leading-relaxed">
          Siklus status: <strong>Draft &rarr; Soft Validation &rarr; Published &rarr; Locked</strong>. Hanya roster <strong>Published</strong> yang aktif di Mobile App &amp; Mesin Presensi.
        </p>
      </div>

      <BaseButton variant="primary-slate" @click="emit('open-create-plan')">
        <PlusIcon class="size-3.5" />
        <span>Buat Roster Plan</span>
      </BaseButton>
    </div>

    <!-- FILTER & SEARCH BAR WITH SINGLE CREATE BUTTON -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
      <div class="relative w-full sm:w-80">
        <SearchIcon class="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari Roster Plan..."
          class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium"
        />
      </div>

      <div class="flex items-center gap-3 w-full sm:w-auto">
        <select
          v-model="statusFilter"
          class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800"
        >
          <option value="">Semua Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="locked">Locked</option>
        </select>
      </div>
    </div>

    <!-- Roster Plans List -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="plan in shiftsStore.rosterPlans"
        :key="plan.id"
        class="p-4 rounded-xl border bg-white shadow-2xs flex flex-col justify-between transition-all hover:border-slate-300 group relative space-y-4"
        :class="
          plan.status === 'published' ? 'border-emerald-300' :
          plan.status === 'locked' ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200'
        "
      >
        <div>
          <!-- Status, Code & Delete Header -->
          <div class="flex items-center justify-between mb-3">
            <span class="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
              {{ plan.code }}
            </span>

            <div class="flex items-center gap-2">
              <BaseBadge
                :variant="
                  plan.status === 'published' ? 'success' :
                  plan.status === 'locked' ? 'neutral' : 'warning'
                "
              >
                {{ plan.status ? plan.status.toUpperCase() : 'DRAFT' }}
              </BaseBadge>

              <!-- Delete Plan Button (Enabled if not locked) -->
              <button
                v-if="plan.status !== 'locked'"
                @click.stop="handleDeletePlan(plan)"
                class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Hapus Roster Plan"
              >
                <TrashIcon class="size-3.5" />
              </button>
            </div>
          </div>

          <!-- Title & Period -->
          <h3 class="font-display font-black text-base text-slate-800 mb-1">
            {{ plan.name }}
          </h3>
          <p class="text-xs text-slate-500 font-mono flex items-center gap-1.5 mb-4">
            <CalendarDaysIcon class="size-3.5 text-slate-400" />
            <span>{{ formatDate(plan.periodStart) }} &ndash; {{ formatDate(plan.periodEnd) }}</span>
          </p>

          <!-- Metrics: Coverage & Warnings -->
          <div class="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs mb-4">
            <div>
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Cakupan (Coverage)</span>
              <span class="font-mono font-black text-sm text-emerald-600 tabular-nums">
                {{ plan.coveragePercentage || 100 }}%
              </span>
            </div>
            <div class="border-l border-slate-200/60 pl-3">
              <span class="block text-[9px] font-bold text-slate-400 uppercase">Warning Validation</span>
              <span 
                class="font-mono font-black text-sm tabular-nums"
                :class="(plan.warningCount || 0) > 0 ? 'text-amber-600' : 'text-slate-600'"
              >
                {{ plan.warningCount || 0 }} Isu
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons Workflow -->
        <div class="space-y-2 border-t border-slate-100 pt-4">
          <!-- 1. Visualisasi Kalender Matriks Tim Grid (1 Bulan) -->
          <BaseButton 
            variant="secondary" 
            class="w-full justify-center text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200" 
            @click="emit('open-matrix-calendar', plan)"
          >
            <CalendarDaysIcon class="size-3.5 text-indigo-600" />
            <span>📊 Kalender Matriks Roster Plan Grid</span>
          </BaseButton>

          <!-- 2. View Generated Daily Roster Entries Table -->
          <div class="grid grid-cols-2 gap-2">
            <BaseButton variant="secondary" class="!py-1.5 text-[10px] w-full justify-center text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 border-slate-200" @click="viewPlanEntries(plan)">
              <EyeIcon class="size-3.5 text-emerald-600" />
              <span>Lihat Entri</span>
            </BaseButton>
            <BaseButton v-if="plan.status !== 'locked'" variant="secondary" class="!py-1.5 text-[10px] w-full justify-center text-slate-700 font-bold bg-slate-50 hover:bg-slate-100 border-slate-200" @click="emit('open-edit-plan', plan)">
              <span>✏️ Edit Plan</span>
            </BaseButton>
          </div>

          <!-- If DRAFT -->
          <template v-if="plan.status === 'draft' || !plan.status">
            <div class="grid grid-cols-2 gap-2">
              <BaseButton variant="secondary" class="!py-1.5 text-[10px] w-full justify-center" @click="emit('generate-plan', plan.id)">
                ⚡ Generate
              </BaseButton>
              <BaseButton variant="secondary" class="!py-1.5 text-[10px] w-full justify-center" @click="emit('validate-plan', plan.id)">
                🔍 Validasi
              </BaseButton>
            </div>
            <BaseButton variant="primary-emerald" class="w-full justify-center text-xs" @click="emit('publish-plan', plan.id)">
              🚀 Publikasikan Roster Plan
            </BaseButton>
          </template>

          <!-- If PUBLISHED -->
          <template v-else-if="plan.status === 'published'">
            <div class="p-2 rounded-lg bg-emerald-50 text-[10px] text-emerald-700 font-semibold text-center mb-1">
              ✅ Aktif di Mobile App &amp; Mesin Presensi
            </div>
            <div class="grid grid-cols-2 gap-2">
              <BaseButton 
                variant="secondary" 
                class="!py-1.5 text-[10px] w-full justify-center font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border-emerald-200" 
                @click="emit('generate-plan', plan.id)"
                title="Generate jadwal khusus karyawan baru tanpa mengubah jadwal lama"
              >
                ⚡ Sync Karyawan Baru
              </BaseButton>
              <BaseButton variant="secondary" class="!py-1.5 text-[10px] w-full justify-center text-slate-700" @click="emit('lock-plan', plan.id)">
                🔒 Kunci Period
              </BaseButton>
            </div>
          </template>

          <!-- If LOCKED -->
          <template v-else-if="plan.status === 'locked'">
            <div class="p-2.5 rounded-lg bg-slate-100 text-[10px] text-slate-600 font-bold text-center">
              🔒 Dikunci (Final Payroll Completed)
            </div>
          </template>
        </div>
      </div>

      <!-- Empty Roster Plans state -->
      <div v-if="!shiftsStore.rosterPlans || !shiftsStore.rosterPlans.length" class="col-span-3 p-12 text-center bg-white border border-dashed border-slate-200 rounded-2xl">
        <CalendarDaysIcon class="size-10 text-slate-300 mx-auto mb-3" />
        <h3 class="font-display font-bold text-slate-700 text-sm mb-1">Belum Ada Container Roster Plan</h3>
        <p class="text-xs text-slate-400 mb-4 max-w-sm mx-auto">Buat Roster Plan baru per periode bulanan untuk mulai meng-generate roster otomatis dan validasi kelengkapan.</p>
        <BaseButton variant="primary-emerald" @click="emit('open-create-plan')">
          <PlusIcon class="size-3.5" />
          <span>Buat Roster Plan Baru</span>
        </BaseButton>
      </div>
    </div>

    <!-- PAGINATION BAR FOR ROSTER PLANS -->
    <div v-if="shiftsStore.rosterPlansPaginated && shiftsStore.rosterPlansPaginated.total > 0" class="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <span class="text-xs text-slate-500 font-mono">
        Total Roster Plan: <strong>{{ shiftsStore.rosterPlansPaginated.total }}</strong>
      </span>
      <BasePagination
        :current-page="shiftsStore.rosterPlansPaginated.current_page || 1"
        :last-page="shiftsStore.rosterPlansPaginated.last_page || 1"
        :total="shiftsStore.rosterPlansPaginated.total || 0"
        :per-page="9"
        @page-change="(p) => fetchFilteredPlans(p)"
      />
    </div>

    <!-- MODAL: DAFTAR SHIFT HARIAN KARYAWAN (DAILY ROSTER ENTRIES) -->
    <div v-if="showEntriesModal && selectedPlan" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
      <div class="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold uppercase mb-1">
              {{ selectedPlan.code }} &bull; Periode: {{ formatDate(selectedPlan.periodStart) }} - {{ formatDate(selectedPlan.periodEnd) }}
            </div>
            <h2 class="font-display font-black text-lg text-slate-800">
              Daftar Shift Harian Karyawan (Hasil Generate Roster)
            </h2>
            <p class="text-xs text-slate-500">Plan: <strong>{{ selectedPlan.name }}</strong></p>
          </div>
          <button @click="showEntriesModal = false" class="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
            <XIcon class="size-5" />
          </button>
        </div>

        <!-- FILTER & SEARCH CONTROL BAR INSIDE MODAL -->
        <div class="py-3 px-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div class="relative w-full md:w-64">
            <SearchIcon class="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="entrySearchQuery"
              @input="fetchEntriesPage(1)"
              type="text"
              placeholder="Cari NIK / Nama Karyawan..."
              class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto">
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase">Dari:</span>
              <input
                v-model="entryStartDate"
                @change="fetchEntriesPage(1)"
                type="date"
                class="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[10px] font-bold text-slate-400 uppercase">s/d:</span>
              <input
                v-model="entryEndDate"
                @change="fetchEntriesPage(1)"
                type="date"
                class="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              v-if="entrySearchQuery || entryStartDate || entryEndDate"
              @click="resetEntryFilters"
              class="px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reset Filter"
            >
              Reset Filter
            </button>
          </div>
        </div>

        <!-- Table Body -->
        <div class="flex-1 overflow-y-auto py-4">
          <div v-if="isLoadingEntries" class="p-8 text-center text-slate-400 font-mono text-xs italic">
            Memuat daftar entri shift harian...
          </div>
          <div v-else>
            <table class="w-full text-left text-xs" role="table">
              <thead>
                <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50">
                  <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Nama Karyawan</th>
                  <th class="py-3 px-4 font-semibold" scope="col">Tanggal Kerja</th>
                  <th class="py-3 px-4 font-semibold" scope="col">Shift Ditugaskan</th>
                  <th class="py-3 px-4 font-semibold" scope="col">Jam Kerja (Start - End)</th>
                  <th class="py-3 px-4 font-semibold text-center" scope="col">Status Roster</th>
                  <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi Adjustment</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-for="r in planEntries" :key="r.id" class="hover:bg-slate-50/70 transition-colors">
                  <td class="py-3.5 px-4">
                    <span class="block font-bold text-slate-800">{{ r.employee ? r.employee.name : (r.employee_name || 'Budi Santoso') }}</span>
                    <span class="block text-[10px] text-slate-400 font-mono">{{ r.employee ? (r.employee.nik || r.employee.employee_code) : 'EMP-00045' }} &mdash; {{ r.employee?.department?.name || 'Operasional' }}</span>
                  </td>
                  <td class="py-3.5 px-4 font-mono font-semibold text-slate-700">{{ formatDate(r.date) }}</td>
                  <td class="py-3.5 px-4 font-bold text-emerald-700">
                    <span v-if="r.shift">{{ r.shift.name }} ({{ r.shift.code || 'SF' }})</span>
                    <span v-else class="text-amber-600 font-semibold italic">🌴 Day Off (Libur Rotasi / Weekend)</span>
                  </td>
                  <td class="py-3.5 px-4 font-mono text-slate-600">
                    <span v-if="r.shift">{{ r.shift.start_time || r.shift.startTime }} &ndash; {{ r.shift.end_time || r.shift.endTime }}</span>
                    <span v-else class="text-slate-400">&mdash;</span>
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <BaseBadge :variant="r.shift ? 'success' : 'neutral'">
                      {{ r.shift ? 'SCHEDULED' : 'OFF' }}
                    </BaseBadge>
                  </td>
                  <td class="py-3.5 px-4 text-center">
                    <BaseButton
                      variant="secondary"
                      class="!py-1 !px-2.5 text-[10px] font-bold text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 border-slate-200"
                      @click="openAdjustmentModal(r)"
                      title="Adjust / Edit 1 Sel Shift Harian (Manual Override)"
                    >
                      <span>✏️ Adjust Shift</span>
                    </BaseButton>
                  </td>
                </tr>
                <tr v-if="!planEntries.length">
                  <td colspan="6" class="py-8 text-center text-slate-400 italic">
                    Belum ada entri roster harian yang digenerate untuk Roster Plan ini. Klik tombol ⚡ <strong>Generate</strong> untuk meng-generate jadwal shift harian otomatis.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer Pagination -->
        <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs text-slate-500 font-mono">Total Entri: <strong>{{ entriesMeta.total }}</strong></span>
          <BasePagination
            :current-page="entriesMeta.page || entriesMeta.current_page || 1"
            :last-page="entriesMeta.last_page || 1"
            :total="entriesMeta.total || 0"
            :per-page="15"
            @page-change="(p) => fetchEntriesPage(p)"
          />
        </div>
      </div>
    </div>

    <!-- MODAL: SCHEDULE ADJUSTMENT (MANUAL OVERRIDE LOCK) -->
    <ScheduleAdjustmentModal
      :show="showAdjustmentModal"
      :schedule="editingSchedule"
      @close="showAdjustmentModal = false"
      @saved="handleScheduleAdjusted"
    />
  </div>
</template>
