<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useErpStore } from '../../store/erp'
import BaseButton from '../../components/BaseButton.vue'
import { ArrowLeftIcon } from '@lucide/vue'
import * as api from '../../api'

const route = useRoute()
const router = useRouter()
const erpStore = useErpStore()

const positionId = ref(route.params.id)
const form = ref({
  name: ''
})

onMounted(async () => {
  try {
    const res = await api.fetchPosition(positionId.value)
    if (res && res.success && res.data) {
      form.value = {
        name: res.data.name
      }
    }
  } catch (err) {
    alert('Gagal memuat data jabatan: ' + err.message)
  }
})

const handleSave = async () => {
  try {
    await erpStore.updatePositionAction(positionId.value, form.value)
    router.push({ path: '/employees', query: { tab: 'positions' } })
  } catch (err) {
    alert('Aksi gagal: ' + err.message)
  }
}
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none">
    <div class="mb-8 flex items-center gap-4">
      <BaseButton variant="secondary" @click="router.push({ path: '/employees', query: { tab: 'positions' } })" class="!p-2">
        <ArrowLeftIcon class="size-4" />
      </BaseButton>
      <div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight">
          Edit Data Jabatan
        </h1>
        <p class="text-xs text-slate-500">
          Ubah nama/posisi jabatan struktural untuk penugasan karyawan.
        </p>
      </div>
    </div>

    <div class="max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <form @submit.prevent="handleSave" class="flex flex-col gap-4 font-sans text-xs">
        <div>
          <label class="block font-bold text-slate-500 uppercase mb-1">Nama Jabatan</label>
          <input v-model="form.name" required type="text" placeholder="QA Engineer" class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-500 text-xs" />
        </div>

        <div class="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <BaseButton variant="secondary" @click="router.push({ path: '/employees', query: { tab: 'positions' } })">Batal</BaseButton>
          <BaseButton variant="primary-emerald" type="submit">Simpan</BaseButton>
        </div>
      </form>
    </div>
  </main>
</template>
