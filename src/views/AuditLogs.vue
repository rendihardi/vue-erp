<script setup>
import { ref, onMounted } from 'vue'
import { useErpStore } from '../store/erp'
import BaseBadge from '../components/BaseBadge.vue'
import BaseButton from '../components/BaseButton.vue'
import BasePagination from '../components/BasePagination.vue'
import { 
  ShieldCheckIcon, 
  SearchIcon, 
  ClockIcon, 
  UserIcon, 
  ActivityIcon,
  FilterIcon
} from '@lucide/vue'

const erpStore = useErpStore()

const searchModule = ref('')
const searchUser = ref('')
const selectedAction = ref('')
const currentPage = ref(1)
const perPage = 10

const filteredLogs = ref([])

const filterLogs = () => {
  if (!erpStore.auditLogs) return
  filteredLogs.value = erpStore.auditLogs.filter(log => {
    const matchModule = !searchModule.value || (log.module && log.module.toLowerCase().includes(searchModule.value.toLowerCase()))
    const matchUser = !searchUser.value || (log.user_name && log.user_name.toLowerCase().includes(searchUser.value.toLowerCase()))
    const matchAction = !selectedAction.value || (log.action && log.action.toLowerCase() === selectedAction.value.toLowerCase())
    return matchModule && matchUser && matchAction
  })
}

const handlePageChange = (page) => {
  currentPage.value = page
}

onMounted(async () => {
  await erpStore.loadAuditLogs()
  filterLogs()
})
</script>

<template>
  <main class="flex-1 p-8 overflow-y-auto h-full bg-slate-50 overscroll-none" id="main-content">
    <!-- Header -->
    <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2">
          Security & Compliance Core
        </div>
        <h1 class="font-display font-black text-2xl text-slate-800 tracking-tight mb-1">
          Audit Logs (Jejak Aktivitas Sistem)
        </h1>
        <p class="text-xs text-slate-500">
          Catatan rekam jejak aktivitas operasional, perubahan data master, presensi biometrik, dan manajemen hak akses.
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm mb-6 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-[200px]">
        <input 
          v-model="searchModule" 
          @input="filterLogs" 
          type="text" 
          placeholder="Cari nama modul..." 
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium" 
        />
      </div>
      <div class="relative flex-1 min-w-[200px]">
        <input 
          v-model="searchUser" 
          @input="filterLogs" 
          type="text" 
          placeholder="Cari nama user / NIK..." 
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium" 
        />
      </div>
      <div class="w-44">
        <select 
          v-model="selectedAction" 
          @change="filterLogs" 
          class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white"
        >
          <option value="">Semua Aksi Action</option>
          <option value="create">CREATE (Tambah)</option>
          <option value="update">UPDATE (Ubah)</option>
          <option value="delete">DELETE (Hapus)</option>
          <option value="login">LOGIN (Otentikasi)</option>
        </select>
      </div>
    </div>

    <!-- Logs Table -->
    <div class="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs" role="table">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50">
              <th class="py-3 px-4 font-semibold rounded-l-lg" scope="col">Waktu & Tanggal</th>
              <th class="py-3 px-4 font-semibold" scope="col">User / Pelaku</th>
              <th class="py-3 px-4 font-semibold" scope="col">Modul</th>
              <th class="py-3 px-4 font-semibold" scope="col">Tipe Aksi</th>
              <th class="py-3 px-4 font-semibold rounded-r-lg" scope="col">Detail Catatan / Payloads</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-sans">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-slate-50/80 transition-colors">
              <td class="py-3.5 px-4 font-mono text-slate-500 font-medium">
                {{ log.created_at || log.timestamp }}
              </td>
              <td class="py-3.5 px-4 font-bold text-slate-800">
                <span class="block">{{ log.user_name || log.user || 'System' }}</span>
                <span class="block text-[10px] text-slate-400 font-normal font-mono">{{ log.ip_address || '127.0.0.1' }}</span>
              </td>
              <td class="py-3.5 px-4 text-slate-700 font-semibold">
                {{ log.module }}
              </td>
              <td class="py-3.5 px-4">
                <BaseBadge 
                  :variant="
                    log.action === 'create' ? 'success' : 
                    log.action === 'delete' ? 'danger' : 
                    log.action === 'update' ? 'warning' : 'info'
                  "
                >
                  {{ log.action ? log.action.toUpperCase() : 'INFO' }}
                </BaseBadge>
              </td>
              <td class="py-3.5 px-4 text-slate-600 font-mono text-[11px] max-w-xs truncate">
                {{ log.description || log.details || '-' }}
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td colspan="5" class="py-12 text-center text-slate-400 font-medium">
                Belum ada rekam log aktivitas sistem ditemukan.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <BasePagination
        :current-page="currentPage"
        :last-page="Math.ceil(filteredLogs.length / perPage) || 1"
        :total="filteredLogs.length"
        :per-page="perPage"
        @page-change="handlePageChange"
      />
    </div>
  </main>
</template>
