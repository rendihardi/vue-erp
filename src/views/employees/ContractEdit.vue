<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const employeeStore = useEmployeeStore()

const contractId = ref(route.params.id)
const form = ref({
  employee_id: '',
  contract_type: 'PKWT',
  start_date: '',
  end_date: '',
  status: 'active'
})

const docFile = ref(null)
const currentDocUrl = ref(null)

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
  try {
    const res = await employeeStore.fetchContract(contractId.value)
    if (res && res.success && res.data) {
      const c = res.data
      currentDocUrl.value = c.document_url || c.download_url || null
      form.value = {
        employee_id: c.employee_id,
        contract_number: c.contract_number,
        contract_type: c.contract_type,
        start_date: c.start_date,
        end_date: c.end_date || '',
        status: c.status
      }
    }
  } catch (err) {
    alert('Gagal memuat detail kontrak: ' + err.message)
  }
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
    await employeeStore.updateContractAction(contractId.value, payload)
    router.push('/employees/contracts')
  } catch (err) {
    alert('Gagal memperbarui kontrak: ' + err.message)
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
          Edit Kontrak Kerja
        </h1>
        <p class="text-xs text-slate-500">
          Ubah berkas catatan kontrak kerja karyawan (PKWT, PKWTT, atau Internship).
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
          <label class="block font-bold text-slate-500 uppercase mb-1">Berkas Dokumen Kontrak</label>
          <div v-if="currentDocUrl" class="mb-2 flex items-center gap-2">
            <span class="text-xs font-semibold text-emerald-600 font-mono">📄 Dokumen Tersedia</span>
            <a :href="currentDocUrl" target="_blank" class="text-[11px] text-[#3b52f6] hover:underline font-bold">Unduh Dokumen Lama</a>
          </div>
          <input type="file" accept=".pdf,.doc,.docx" @change="handleDocChange" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#3b52f6] hover:file:bg-blue-100" />
          <p class="text-[10px] text-slate-400 mt-1">Pilih berkas baru jika ingin mengganti dokumen (opsional, PDF/DOC/DOCX max 5MB).</p>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push('/employees/contracts')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan Kontrak</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
