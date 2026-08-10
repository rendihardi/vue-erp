<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployeeStore } from '../../store/employees'
import { useShiftsStore } from '../../store/shifts'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const router = useRouter()
const employeeStore = useEmployeeStore()
const shiftsStore = useShiftsStore()

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
  work_schedule_id: '',
  shift_id: '',
  status: 'active',
  role: 'employee'
})

const avatarFile = ref(null)

const handleAvatarChange = (e) => {
  const file = e.target.files[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file avatar tidak boleh melebihi 2MB')
      e.target.value = ''
      return
    }
    avatarFile.value = file
  }
}

onMounted(async () => {
  await Promise.allSettled([
    employeeStore.loadDepartmentsOnly(),
    employeeStore.loadPositionsOnly(),
    employeeStore.loadOfficeLocationsOnly(),
    shiftsStore.fetchShiftsOnlyAction(),
    shiftsStore.fetchWorkScheduleMastersAction()
  ])
})

const handleSave = async () => {
  try {
    let payload
    if (avatarFile.value) {
      payload = new FormData()
      Object.keys(form.value).forEach(key => {
        let val = form.value[key]
        if (key === 'work_schedule_id' || key === 'shift_id') {
          val = form.value.shift_mode === 'fixed' ? (val || '') : ''
        }
        if (val !== null && val !== undefined) {
          payload.append(key, val)
        }
      })
      payload.append('avatar', avatarFile.value)
    } else {
      payload = {
        ...form.value,
        work_schedule_id: form.value.shift_mode === 'fixed' ? (form.value.work_schedule_id || null) : null,
        shift_id: form.value.shift_mode === 'fixed' ? (form.value.shift_id || null) : null
      }
    }
    await employeeStore.createEmployeeAction(payload)
    router.push('/employees')
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push('/employees')" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          Tambah Karyawan Baru
        </h1>
        <p class="text-xs text-slate-500">
          Masukkan detail informasi data diri karyawan baru dan kredensial login akun.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Foto Avatar (Opsional, JPG/PNG/WebP max 2MB)</label>
          <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleAvatarChange" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#3b52f6] hover:file:bg-blue-100" />
        </div>

        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">NIK KTP (16 Digit)</label>
          <input v-model="form.nik" required type="text" minlength="16" maxlength="16" placeholder="3201234567890123" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
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
          <label class="block font-bold text-slate-500 uppercase mb-1">Password</label>
          <input v-model="form.password" required type="password" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">No. Telp</label>
          <input v-model="form.phone" required type="text" placeholder="081234567895" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Departemen</label>
          <select v-model="form.department_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Departemen --</option>
            <option v-for="dept in employeeStore.departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Jabatan</label>
          <select v-model="form.position_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Jabatan --</option>
            <option v-for="pos in employeeStore.positions" :key="pos.id" :value="pos.id">{{ pos.name }}</option>
          </select>
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Lokasi Kantor Cabang</label>
          <select v-model="form.office_location_id" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs">
            <option value="">-- Pilih Lokasi Cabang --</option>
            <option v-for="loc in employeeStore.officeLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>

        <!-- Shift Mode (Fixed vs Roster) -->
        <div class="border-t border-slate-100 pt-3 space-y-4">
          <div>
            <label class="block font-bold text-slate-500 uppercase mb-1">Pola Mode Shift</label>
            <select v-model="form.shift_mode" required class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs font-semibold">
              <option value="fixed">Fixed (Shift Kerja Tetap Kantor)</option>
              <option value="roster">Roster (Shift Bergilir Pabrik/RS/Tambang)</option>
            </select>
          </div>

          <!-- Section Khusus Mode Fixed -->
          <div v-if="form.shift_mode === 'fixed'" class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
            <div>
              <label class="block font-bold text-emerald-800 uppercase mb-1 text-[10px]">Master Pola Kerja Kantor (work_schedule_id)</label>
              <select v-model="form.work_schedule_id" class="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs font-medium">
                <option value="">-- Master Default (WS-REG-5D / 5 Hari) --</option>
                <option v-for="ws in shiftsStore.workScheduleMasters" :key="ws.id" :value="ws.id">
                  {{ ws.name }} ({{ ws.code }})
                </option>
              </select>
              <p class="text-[10px] text-slate-400 mt-1">Kosongkan untuk otomatis menggunakan Master Default 5 Hari Kerja.</p>
            </div>

            <div>
              <label class="block font-bold text-emerald-800 uppercase mb-1 text-[10px]">Shift Tetap Pagi/Kantor (shift_id)</label>
              <select v-model="form.shift_id" class="w-full bg-white border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs font-medium">
                <option value="">-- Pilih Jam Shift Tetap --</option>
                <option v-for="sf in shiftsStore.shifts" :key="sf.id" :value="sf.id">{{ sf.name }} ({{ sf.startTime }} - {{ sf.endTime }})</option>
              </select>
            </div>
          </div>

          <div v-else class="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 italic">
            ℹ️ Pada mode Roster: <code class="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">work_schedule_id = null</code> dan <code class="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-700">shift_id = null</code>. Shift harian karyawan ditentukan via Tim Shift &amp; Roster Plan bulanan.
          </div>
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
