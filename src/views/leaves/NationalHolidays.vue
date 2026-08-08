<script setup>
import { ref, onMounted } from 'vue'
import { useErpStore } from '../../store/erp'
import BaseBadge from '../../components/BaseBadge.vue'
import BaseButton from '../../components/BaseButton.vue'
import { 
  CalendarIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  SparklesIcon,
  ShieldCheckIcon,
  CheckCircleIcon
} from '@lucide/vue'

const erpStore = useErpStore()

const selectedYear = ref(new Date().getFullYear())
const showModal = ref(false)
const isEdit = ref(false)
const editingId = ref(null)

const form = ref({
  name: '',
  date: '',
  is_mass_leave: false
})

const fetchHolidays = async () => {
  await erpStore.loadNationalHolidays(selectedYear.value)
}

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-'
  return dateStr.includes('T') ? dateStr.split('T')[0] : dateStr
}

const openCreateModal = () => {
  isEdit.value = false
  editingId.value = null
  form.value = { name: '', date: '', is_mass_leave: false }
  showModal.value = true
}

const openEditModal = (holiday) => {
  isEdit.value = true
  editingId.value = holiday.id
  form.value = {
    name: holiday.name,
    date: holiday.date ? (holiday.date.includes('T') ? holiday.date.split('T')[0] : holiday.date) : '',
    is_mass_leave: !!holiday.is_mass_leave
  }
  showModal.value = true
}

const handleSave = async () => {
  try {
    if (isEdit.value) {
      await erpStore.updateNationalHolidayAction(editingId.value, form.value)
    } else {
      await erpStore.createNationalHolidayAction(form.value)
    }
    showModal.value = false
    await fetchHolidays()
  } catch (err) {
    alert('Gagal menyimpan libur nasional: ' + err.message)
  }
}

const handleDelete = async (id) => {
  if (!confirm('Apakah Anda yakin ingin menghapus jadwal libur ini?')) return
  try {
    await erpStore.deleteNationalHolidayAction(id)
    await fetchHolidays()
  } catch (err) {
    alert('Penghapusan gagal: ' + err.message)
  }
}

onMounted(async () => {
  await erpStore.loadNationalHolidays()
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Shared Services & Calendar Core
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Hari Libur Nasional & Kalender Perusahaan
        </h1>
        <p class="text-xs text-slate-500">
          Atur penanggalan libur resmi nasional & cuti bersama perusahaan yang memotong saldo cuti / perhitungan payroll.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <!-- Year Filter -->
        <select 
          v-model="selectedYear" 
          @change="fetchHolidays"
          class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-sm"
        >
          <option :value="2025">Tahun 2025</option>
          <option :value="2026">Tahun 2026</option>
          <option :value="2027">Tahun 2027</option>
        </select>

        <BaseButton variant="primary-emerald" @click="openCreateModal">
          <PlusIcon class="size-3.5" />
          <span>Tambah Hari Libur</span>
        </BaseButton>
      </div>
    </div>

    <!-- Content Table -->
    <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Tanggal Hari Libur</th>
              <th class="py-3 px-4 font-semibold" scope="col">Nama Hari Libur / Peringatan</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tipe Libur</th>
              <th class="py-3 px-4 font-semibold text-center rounded-r-lg" scope="col">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="holiday in erpStore.nationalHolidays" :key="holiday.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-mono font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon class="size-3.5 text-emerald-600 shrink-0" />
                <span>{{ formatDateDisplay(holiday.date) }}</span>
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-700">{{ holiday.name }}</td>
              <td class="py-3.5 px-4">
                <BaseBadge :variant="holiday.is_mass_leave ? 'warning' : 'info'">
                  {{ holiday.is_mass_leave ? 'Cuti Bersama' : 'Libur Nasional' }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-4 text-center">
                <div class="flex justify-center gap-1.5">
                  <BaseButton variant="secondary" class="!p-1.5" @click="openEditModal(holiday)">
                    <EditIcon class="size-3.5" />
                  </BaseButton>
                  <BaseButton variant="danger" class="!p-1.5" @click="handleDelete(holiday.id)">
                    <TrashIcon class="size-3.5" />
                  </BaseButton>
                </div>
              </td>
            </tr>
            <tr v-if="erpStore.nationalHolidays.length === 0">
              <td colspan="4" class="py-12 text-center text-slate-400 font-medium">
                Belum ada data libur nasional tercatat untuk tahun {{ selectedYear }}.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-150">
        <h2 class="font-display font-black text-lg text-slate-800 mb-1">
          {{ isEdit ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru' }}
        </h2>
        <p class="text-xs text-slate-500 mb-6">Tentukan tanggal dan keterangan resmi libur nasional atau cuti bersama.</p>

        <form @submit.prevent="handleSave" class="flex flex-col gap-4 text-xs font-sans">
          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Nama Hari Libur</label>
            <input 
              v-model="form.name" 
              required 
              type="text" 
              placeholder="Hari Raya Idul Fitri 1447 H" 
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-xs font-medium text-slate-800" 
            />
          </div>

          <div>
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Tanggal</label>
            <input 
              v-model="form.date" 
              required 
              type="date" 
              class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 text-xs font-mono text-slate-800" 
            />
          </div>

          <div class="flex items-center gap-2 pt-1">
            <input 
              id="mass_leave" 
              v-model="form.is_mass_leave" 
              type="checkbox" 
              class="size-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
            />
            <label for="mass_leave" class="text-xs font-medium text-slate-700">Tandai sebagai Cuti Bersama (Mass Leave)</label>
          </div>

          <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
            <BaseButton variant="secondary" type="button" @click="showModal = false">Batal</BaseButton>
            <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
          </div>
        </form>
      </div>
    </div>
  </main>
</template>
