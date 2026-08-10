<script setup>
import { ref, onMounted } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import BaseBadge from '../../../components/BaseBadge.vue'
import BaseButton from '../../../components/BaseButton.vue'
import { ClockIcon, PlusIcon, EditIcon, TrashIcon, RefreshCwIcon, CheckCircle2Icon, CalendarIcon } from '@lucide/vue'
import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const shiftsStore = useShiftsStore()

const isLoading = ref(false)
const isSubmitting = ref(false)

const masterForm = ref({
  id: null,
  name: '',
  code: '',
  off_days: [0, 6],
  description: ''
})

const resetForm = () => {
  masterForm.value = {
    id: null,
    name: '',
    code: '',
    off_days: [0, 6],
    description: ''
  }
}

const openEditMaster = (master) => {
  masterForm.value = {
    id: master.id,
    name: master.name,
    code: master.code,
    off_days: Array.isArray(master.off_days) ? [...master.off_days] : [0, 6],
    description: master.description || ''
  }
}

const toggleOffDay = (dayIndex) => {
  const current = [...masterForm.value.off_days]
  const idx = current.indexOf(dayIndex)
  if (idx >= 0) {
    current.splice(idx, 1)
  } else {
    current.push(dayIndex)
  }
  masterForm.value.off_days = current
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

const formatOffDaysLabel = (offDays) => {
  if (!Array.isArray(offDays) || offDays.length === 0) {
    return 'Tanpa Libur (7 Hari Kerja)'
  }

  const sorted = [...offDays].map(Number).sort((a, b) => a - b)
  if (JSON.stringify(sorted) === JSON.stringify([0, 6])) {
    return '5 Hari Kerja (Sabtu & Minggu OFF)'
  }
  if (JSON.stringify(sorted) === JSON.stringify([0])) {
    return '6 Hari Kerja (Minggu OFF)'
  }

  const dayLabels = sorted.map(d => DAY_NAMES[d] || `Hari ${d}`).join(', ')
  return `Libur (${offDays.length} Hari): ${dayLabels}`
}

const loadMastersData = async () => {
  try {
    isLoading.value = true
    await shiftsStore.fetchWorkScheduleMastersAction()
  } catch (err) {
    showToastError('Gagal memuat Master Pola Kerja: ' + err.message)
  } finally {
    isLoading.value = false
  }
}

const handleSaveMaster = async () => {
  if (!masterForm.value.name.trim() || !masterForm.value.code.trim()) {
    showToastWarning('Harap isi Nama dan Kode Master Pola Kerja!')
    return
  }

  try {
    isSubmitting.value = true
    let res
    if (masterForm.value.id) {
      res = await shiftsStore.updateWorkScheduleMasterAction(masterForm.value.id, masterForm.value)
    } else {
      res = await shiftsStore.createWorkScheduleMasterAction(masterForm.value)
    }

    if (res && res.success) {
      showToastSuccess(`✅ Master Pola Kerja "${masterForm.value.name}" berhasil disimpan!`)
      resetForm()
      await loadMastersData()
    } else {
      showToastError(res?.message || 'Gagal menyimpan Master Pola Kerja.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}

const handleDeleteMaster = async (id, name) => {
  if (!confirm(`Apakah Anda yakin ingin menghapus Master Pola Kerja "${name}"?`)) return
  try {
    const res = await shiftsStore.deleteWorkScheduleMasterAction(id)
    if (res && res.success) {
      showToastSuccess(`🗑️ Master Pola Kerja "${name}" berhasil dihapus.`)
      await loadMastersData()
    } else {
      showToastError(res?.message || 'Penghapusan gagal.')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  }
}

onMounted(() => {
  loadMastersData()
})
</script>

<template>
  <div class="space-y-5 font-sans">
    <!-- HEADER SECTION -->
    <div class="p-5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md mb-1.5 font-mono">
          API: /api/v1/work-schedule-masters
        </div>
        <h2 class="font-bold text-base text-slate-900 flex items-center gap-2">
          <ClockIcon class="size-4 text-slate-700" />
          <span>Master Pola Kerja Perusahaan (Work Schedule Masters)</span>
        </h2>
        <p class="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Kelola master pola hari kerja dan aturan hari libur (off_days) perusahaan. Aturan master ini berlaku untuk seluruh karyawan terikat fixed shift.
        </p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <BaseButton variant="secondary" @click="loadMastersData" class="!py-1.5 !px-3">
          <RefreshCwIcon class="size-3.5 text-slate-600" :class="{ 'animate-spin': isLoading }" />
          <span>Refresh Data</span>
        </BaseButton>
      </div>
    </div>

    <!-- MAIN TWO-COLUMN LAYOUT -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <!-- COLUMN 1: FORM CREATE / EDIT MASTER -->
      <div class="lg:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs h-fit space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="font-bold text-xs uppercase tracking-wider text-slate-800">
            {{ masterForm.id ? 'Edit Master Pola Kerja' : 'Tambah Master Pola Kerja' }}
          </h3>
          <button v-if="masterForm.id" @click="resetForm" class="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
            Batal Edit
          </button>
        </div>

        <form @submit.prevent="handleSaveMaster" class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1.5">Nama Pola Kerja <span class="text-rose-600">*</span></label>
            <input
              v-model="masterForm.name"
              required
              type="text"
              placeholder="Contoh: Jadwal Toko Retail (Senin Libur)"
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-medium"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1.5">Kode Master Pola <span class="text-rose-600">*</span></label>
            <input
              v-model="masterForm.code"
              required
              type="text"
              placeholder="Contoh: WS-RETAIL-MON"
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 font-mono font-bold uppercase"
            />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1.5">Pilih Hari Libur (off_days)</label>
            <div class="grid grid-cols-4 gap-1 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <button
                v-for="(dayName, dIdx) in DAY_NAMES"
                :key="dIdx"
                type="button"
                @click="toggleOffDay(dIdx)"
                class="py-1 px-1.5 text-[11px] font-semibold rounded transition-colors border text-center"
                :class="masterForm.off_days.includes(dIdx) ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'"
              >
                {{ dayName }}
              </button>
            </div>
            <div class="mt-2 text-[11px] font-mono text-slate-700 font-semibold bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              Status Libur: {{ formatOffDaysLabel(masterForm.off_days) }}
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 text-xs mb-1.5">Deskripsi</label>
            <textarea
              v-model="masterForm.description"
              rows="3"
              placeholder="Keterangan detail aturan jam kerja master..."
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-800 focus:ring-1 focus:ring-slate-800 resize-none font-medium"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <BaseButton v-if="masterForm.id" variant="secondary" type="button" @click="resetForm">
              Batal
            </BaseButton>
            <BaseButton variant="primary-slate" type="submit" :disabled="isSubmitting">
              <span>{{ isSubmitting ? 'Menyimpan...' : (masterForm.id ? 'Update Master' : 'Simpan Master') }}</span>
            </BaseButton>
          </div>
        </form>
      </div>

      <!-- COLUMN 2: GRID LIST MASTER POLA KERJA -->
      <div class="lg:col-span-2 space-y-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-900 text-xs">Master Pola Kerja Terdaftar</span>
            <BaseBadge variant="slate">
              {{ shiftsStore.workScheduleMasters ? shiftsStore.workScheduleMasters.length : 0 }} Master
            </BaseBadge>
          </div>
        </div>

        <div v-if="isLoading" class="p-8 text-center text-slate-400 text-xs italic">
          Memuat daftar master pola kerja...
        </div>
        <div v-else-if="!shiftsStore.workScheduleMasters || !shiftsStore.workScheduleMasters.length" class="p-8 text-center text-slate-500 text-xs italic bg-white rounded-xl border border-dashed border-slate-300">
          Belum ada master pola kerja terdaftar.
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="m in shiftsStore.workScheduleMasters" 
            :key="m.id"
            class="p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors shadow-xs flex items-center justify-between gap-4"
          >
            <div>
              <div class="flex items-start justify-between gap-2 mb-2">
                <h3 class="font-bold text-slate-900 text-xs leading-snug">
                  {{ m.name }}
                </h3>
                <span class="font-mono text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase shrink-0">
                  {{ m.code }}
                </span>
              </div>

              <div class="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 w-full mb-2">
                <CalendarIcon class="size-3.5 text-slate-500 shrink-0" />
                <span class="font-mono text-[11px] font-semibold text-slate-800 truncate">
                  {{ formatOffDaysLabel(m.off_days) }}
                </span>
              </div>

              <p v-if="m.description" class="text-xs text-slate-500 line-clamp-2 mt-1">
                {{ m.description }}
              </p>
              <p v-else class="text-[11px] text-slate-400 italic">
                Tanpa keterangan tambahan
              </p>
            </div>

            <div class="flex items-center justify-between pt-3 border-t border-slate-100">
              <span class="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                <CheckCircle2Icon class="size-3 text-emerald-600" />
                <span>Terikat Karyawan Fixed</span>
              </span>

              <div class="flex items-center gap-1.5">
                <button
                  @click="openEditMaster(m)"
                  class="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <EditIcon class="size-3" />
                  <span>Edit</span>
                </button>
                <button
                  @click="handleDeleteMaster(m.id, m.name)"
                  class="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors flex items-center gap-1"
                >
                  <TrashIcon class="size-3" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
