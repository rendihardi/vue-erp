<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const router = useRouter()
const employeeStore = useEmployeeStore()

const form = ref({
  employee_id: '',
  contract_type: 'PKWT',
  start_date: '',
  end_date: '',
  status: 'active'
})

const docFile = ref(null)

const handleDocChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran berkas dokumen tidak boleh melebihi 5MB')
      e.target.value = ''
      return
    }
    docFile.value = file
  }
}

onMounted(async () => {
  await employeeStore.loadEmployeesOnly()
})

const handleSave = async () => {
  try {
    let payload
    if (docFile.value) {
      payload = new FormData()
      Object.keys(form.value).forEach(key => {
        let val = form.value[key]
        if (key === 'end_date' && form.value.contract_type === 'PKWTT') {
          val = ''
        }
        if (val !== null && val !== undefined) {
          payload.append(key, val)
        }
      })
      payload.append('document_file', docFile.value)
    } else {
      payload = { ...form.value }
      if (payload.contract_type === 'PKWTT') {
        payload.end_date = null
      }
    }
    await employeeStore.createContractAction(payload)
    router.push('/employees/contracts')
  } catch (err) {
    alert('Gagal menambahkan kontrak: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push('/employees/contracts')" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          Tambah Kontrak Kerja Baru
        </h1>
        <p class="text-xs text-slate-500">
          Buat berkas catatan kontrak kerja baru (PKWT, PKWTT, atau Internship) untuk karyawan.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Karyawan</label>
          <select v-model="form.employee_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Karyawan --</option>
            <option v-for="emp in employeeStore.employees" :key="emp.id" :value="emp.id">
              {{ emp.name }} ({{ emp.nik }})
            </option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Tipe Kontrak</label>
          <select v-model="form.contract_type" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="PKWT">PKWT (Kontrak Waktu Tertentu)</option>
            <option value="PKWTT">PKWTT (Karyawan Tetap)</option>
            <option value="Internship">Internship (Magang)</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Tanggal Mulai</label>
          <input v-model="form.start_date" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div v-if="form.contract_type !== 'PKWTT'">
          <label class="block font-bold text-slate-500 uppercase mb-1">Tanggal Selesai</label>
          <input v-model="form.end_date" required type="date" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Status</label>
          <select v-model="form.status" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Berkas Dokumen Kontrak (Opsional, PDF/DOC/DOCX max 5MB)</label>
          <input type="file" accept=".pdf,.doc,.docx" @change="handleDocChange" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#3b52f6] hover:file:bg-blue-100" />
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push('/employees/contracts')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan Kontrak</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
