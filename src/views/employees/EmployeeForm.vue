<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '../../store/erp'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const erpStore = useErpStore()

const isEdit = ref(false)
const employeeId = ref(null)

const form = ref({
  nik: '',
  name: '',
  email: '',
  password: '',
  phone: '',
  department_id: '',
  position_id: '',
  office_location_id: '',
  shift_mode: 'fixed',
  status: 'active',
  role: 'employee'
})

onMounted(async () => {
  await Promise.allSettled([
    erpStore.loadDepartmentsOnly(),
    erpStore.loadPositionsOnly(),
    erpStore.loadOfficeLocationsOnly(),
    erpStore.fetchShiftsOnlyAction()
  ])
  if (route.params.id) {
    isEdit.value = true
    employeeId.value = route.params.id
    
    // Find employee from store
    const emp = erpStore.employees.find(e => String(e.id) === String(employeeId.value))
    if (emp) {
      form.value = {
        nik: emp.nik || '',
        name: emp.name,
        email: emp.email || '',
        password: '', // Kept empty on edit
        phone: emp.phone || '',
        department_id: emp.departmentId || '',
        position_id: emp.positionId || '',
        office_location_id: emp.officeLocationId || '',
        shift_mode: emp.shiftMode || 'fixed',
        status: emp.status.toLowerCase() === 'active' ? 'active' : 'inactive',
        role: emp.role || 'employee'
      }
    }
  }
})

const handleSave = async () => {
  try {
    const payload = { ...form.value }
    if (isEdit.value) {
      if (!payload.password) {
        delete payload.password
      }
      await erpStore.updateEmployeeAction(employeeId.value, payload)
    } else {
      await erpStore.createEmployeeAction(payload)
    }
    router.push('/employees')
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <!-- Header -->
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push('/employees')" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          {{ isEdit ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru' }}
        </h1>
        <p class="text-xs text-slate-500">
          Masukkan detail informasi data diri karyawan, lokasi kerja, pola shift, dan kredensial login.
        </p>
      </div>
    </div>

    <!-- Form Container -->
    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">NIK Karyawan</label>
          <input v-model="form.nik" required type="text" placeholder="EMP-00003" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Nama Karyawan</label>
          <input v-model="form.name" required type="text" placeholder="Andi Wijaya" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Email</label>
          <input v-model="form.email" required type="email" placeholder="andi@erp.com" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">
            Password {{ isEdit ? '(Kosongkan jika tidak diubah)' : '' }}
          </label>
          <input v-model="form.password" :required="!isEdit" type="password" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">No. Telp</label>
          <input v-model="form.phone" required type="text" placeholder="081234567895" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Departemen</label>
          <select v-model="form.department_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Departemen --</option>
            <option v-for="dept in erpStore.departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Jabatan</label>
          <select v-model="form.position_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Jabatan --</option>
            <option v-for="pos in erpStore.positions" :key="pos.id" :value="pos.id">{{ pos.name }}</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Lokasi Kantor Cabang</label>
          <select v-model="form.office_location_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Lokasi Kantor --</option>
            <option v-for="loc in erpStore.officeLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Mode Shift</label>
          <select v-model="form.shift_mode" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="fixed">Fixed (Jam Jam Regular Tetap)</option>
            <option value="roster">Roster (Shift Berganti / Roster)</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Role Akun</label>
          <select v-model="form.role" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="employee">Employee / Karyawan</option>
            <option value="hr">HR Admin</option>
            <option value="admin">Super Admin</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Status</label>
          <select v-model="form.status" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push('/employees')">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
