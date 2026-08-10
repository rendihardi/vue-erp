<script setup>
import { ref, watch } from 'vue'
import { useShiftsStore } from '../../../store/shifts'
import { useEmployeeStore } from '../../../store/employees'
import BaseButton from '../../../components/BaseButton.vue'

const shiftsStore = useShiftsStore()
const employeeStore = useEmployeeStore()

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  editingTeam: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const form = ref({ name: '', description: '', member_employee_ids: [] })
const availableEmployees = ref([])
const isSubmitting = ref(false)
const isLoadingEmployees = ref(false)

const loadAvailableEmployees = async () => {
  try {
    isLoadingEmployees.value = true
    const res = await shiftsStore.fetchAvailableShiftTeamEmployees('', 1, 100)
    let freeEmps = []
    if (res && res.success && res.data) {
      freeEmps = Array.isArray(res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
    }

    // Combine with current team members if editing
    let currentTeamMembers = []
    if (props.editingTeam && Array.isArray(props.editingTeam.activeMembers)) {
      currentTeamMembers = props.editingTeam.activeMembers.map(m => ({
        id: m.employee_id || m.employee?.id || m.id,
        nik: m.employee?.nik || m.nik || 'EMP-MEMBER',
        name: m.employee?.name || m.name || 'Member Employee',
        dept: m.employee?.department?.name || 'Operasional'
      }))
    }

    // Merge unique employees
    const empMap = new Map()
    freeEmps.forEach(e => empMap.set(e.id, {
      id: e.id,
      nik: e.nik || e.employee_code || String(e.id).slice(0, 7),
      name: e.name,
      dept: e.department ? e.department.name : 'Operasional'
    }))
    currentTeamMembers.forEach(e => empMap.set(e.id, e))

    availableEmployees.value = Array.from(empMap.values())
  } catch (err) {
    console.error('Failed to fetch available employees:', err.message)
    availableEmployees.value = employeeStore.employees || []
  } finally {
    isLoadingEmployees.value = false
  }
}

watch(() => props.show, (isShown) => {
  if (isShown) {
    loadAvailableEmployees()
  }
})

watch(() => props.editingTeam, (team) => {
  if (team) {
    const activeList = Array.isArray(team.activeMembers) ? team.activeMembers : (Array.isArray(team.members) ? team.members : [])
    const memberIds = activeList.map(m => m.employee_id || m.employee?.id || m.id)
    form.value = {
      name: team.name,
      description: team.description || '',
      member_employee_ids: memberIds
    }
  } else {
    form.value = { name: '', description: '', member_employee_ids: [] }
  }
}, { immediate: true })

import { showToastSuccess, showToastError, showToastWarning } from '../../../utils/toast'

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    showToastWarning('Nama tim tidak boleh kosong!')
    return
  }
  try {
    isSubmitting.value = true
    let res
    if (props.editingTeam) {
      res = await shiftsStore.updateShiftTeamAction(props.editingTeam.id, {
        name: form.value.name,
        description: form.value.description,
        member_employee_ids: form.value.member_employee_ids
      })
    } else {
      res = await shiftsStore.createShiftTeamAction({
        name: form.value.name,
        description: form.value.description,
        member_employee_ids: form.value.member_employee_ids
      })
    }
    if (res && res.success) {
      showToastSuccess(props.editingTeam ? '✅ Tim shift berhasil diperbarui!' : `✨ Tim shift '${res.data?.name || form.value.name}' berhasil dibuat!`)
      emit('saved')
      emit('close')
    } else {
      showToastError(res?.message || 'Gagal menyimpan tim shift')
    }
  } catch (err) {
    showToastError('Error: ' + err.message)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
    <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <h2 class="font-display font-black text-lg text-slate-800 mb-1">
        {{ editingTeam ? 'Edit Tim Shift' : 'Buat Tim Shift Baru' }}
      </h2>
      <p class="text-xs text-slate-500 mb-6">
        {{ editingTeam ? `Memperbarui: ${editingTeam.name}` : 'Tim shift adalah kelompok karyawan yang berbagi pola rotasi jadwal yang sama.' }}
        <br /><span class="font-mono text-[10px] text-slate-400">{{ editingTeam ? `PUT /shift-teams/${editingTeam?.id}` : 'POST /shift-teams' }}</span>
      </p>

      <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 text-xs">
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Nama Tim <span class="text-rose-500">*</span></label>
          <input
            v-model="form.name"
            required
            type="text"
            placeholder="contoh: Tim Operational A"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800"
          />
        </div>
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1.5">Deskripsi</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="contoh: Tim Shift Operasional Rotasi 3 Shift (Pagi, Siang, Malam)"
            class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium text-slate-800 resize-none"
          ></textarea>
        </div>

        <!-- Pilih Anggota Tim (Hanya Karyawan Roster Bebas / Tim Ini) -->
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Anggota Tim <span class="text-slate-400 font-normal normal-case">({{ form.member_employee_ids.length }} dipilih)</span>
            </label>
            <span v-if="isLoadingEmployees" class="text-[10px] text-slate-400 font-mono italic">Memuat karyawan bebas...</span>
          </div>

          <div class="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100">
            <label
              v-for="emp in availableEmployees"
              :key="emp.id"
              class="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                :value="emp.id"
                v-model="form.member_employee_ids"
                class="accent-emerald-600 size-4 flex-shrink-0"
              />
              <div>
                <span class="block font-bold text-slate-800">{{ emp.name }}</span>
                <span class="block text-[10px] text-slate-400 font-mono">{{ emp.nik }} &mdash; {{ emp.dept }}</span>
              </div>
            </label>
            <div v-if="!availableEmployees?.length && !isLoadingEmployees" class="p-4 text-center text-slate-400 text-[10px] italic">
              Tidak ada karyawan bebas yang tersedia (Semua karyawan roster sudah memiliki tim).
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
          <BaseButton variant="secondary" type="button" @click="emit('close')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? 'Menyimpan...' : (editingTeam ? 'Simpan Perubahan' : 'Buat Tim') }}
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
