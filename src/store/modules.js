import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useModulesStore = defineStore('modules', () => {
  const modules = ref([
    {
      id: 'employees',
      title: 'Employees (HRIS)',
      description: 'Manajemen data karyawan, kontrak kerja PKWT/PKWTT, pencatatan absensi wajah FastAPI & Geofencing GPS.',
      status: 'active',
      icon: 'UsersIcon',
      tag: 'HR CORE',
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'payroll',
      title: 'Payroll Engine',
      description: 'Kalkulasi payroll bulanan, denda keterlambatan terintegrasi otomatis, tunjangan, dan slip gaji digital.',
      status: 'active',
      icon: 'CreditCardIcon',
      tag: 'FINANCIAL HR',
      color: 'from-purple-500/20 to-indigo-500/10 text-purple-400 border-purple-500/30'
    },
    {
      id: 'inventory',
      title: 'Inventory & Assets',
      description: 'Manajemen pergudangan, logistik log, inventarisasi barang, peminjaman aset kantor, dan serah terima digital.',
      status: 'locked',
      icon: 'PackageIcon',
      tag: 'OPERATIONAL',
      color: 'from-zinc-500/5 to-zinc-500/0 text-zinc-500 border-zinc-800'
    },
    {
      id: 'sales',
      title: 'Sales & CRM',
      description: 'Pencatatan sales pipeline, customer relationship management (CRM), penagihan invoice, dan revenue report.',
      status: 'locked',
      icon: 'TrendingUpIcon',
      tag: 'SALES & CRM',
      color: 'from-zinc-500/5 to-zinc-500/0 text-zinc-500 border-zinc-800'
    }
  ])

  const activeModules = computed(() => modules.value.filter(m => m.status === 'active'))

  return {
    modules,
    activeModules
  }
})
