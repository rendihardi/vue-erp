<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLeavesStore } from '../../store/leaves'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const leavesStore = useLeavesStore()

const leaveTypeId = ref(route.params.id)
const form = ref({
  name: '',
  code: '',
  quota: 12,
  requires_attachment: false,
  is_paid: true
})

onMounted(async () => {
  try {
    const res = await leavesStore.fetchLeaveType(leaveTypeId.value)
    if (res && res.success && res.data) {
      const lt = res.data
      form.value = {
        name: lt.name,
        code: lt.code,
        quota: lt.quota,
        requires_attachment: lt.requires_attachment === 1 || lt.requires_attachment === true,
        is_paid: lt.is_paid === 1 || lt.is_paid === true
      }
    }
  } catch (err) {
    alert('Gagal memuat data kebijakan cuti: ' + err.message)
  }
})

const handleSave = async () => {
  try {
    await leavesStore.updateLeaveTypeAction(leaveTypeId.value, form.value)
    router.push({ path: '/employees/leaves', query: { tab: 'leave-types' } })
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push({ path: '/employees/leaves', query: { tab: 'leave-types' } })" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          Edit Kebijakan Jenis Cuti
        </h1>
        <p class="text-xs text-slate-500">
          Ubah nama kebijakan cuti, batas kuota tahunan, kewajiban unggah dokumen pendukung, dan status pembayaran.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Nama Cuti</label>
          <input v-model="form.name" required type="text" placeholder="Cuti Tahunan" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Kode Cuti</label>
          <input v-model="form.code" required type="text" placeholder="ANNUAL" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Kuota Hari</label>
          <input v-model.number="form.quota" required type="number" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>
        <div>
          <label class="flex items-center gap-2 text-slate-600 cursor-pointer mt-2 text-xs">
            <input type="checkbox" v-model="form.requires_attachment" class="accent-emerald-600 size-4" />
            <span>Wajib Lampiran Berkas (Surat Dokter/Pendukung)</span>
          </label>
        </div>
        <div>
          <label class="flex items-center gap-2 text-slate-600 cursor-pointer text-xs">
            <input type="checkbox" v-model="form.is_paid" class="accent-emerald-600 size-4" />
            <span>Cuti Berbayar (Gaji Pokok Tetap Dibayarkan)</span>
          </label>
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push({ path: '/employees/leaves', query: { tab: 'leave-types' } })">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
