<script setup>
import { 
  FileTextIcon, 
  ClockIcon, 
  CalendarDaysIcon, 
  ShieldCheckIcon,
  ChevronRightIcon 
} from '@lucide/vue'
</script>

<template>
  <div class="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs space-y-3">
    <h3 class="font-bold text-sm text-slate-900">Quick Links</h3>

    <div class="space-y-1 text-xs">
      <RouterLink 
        to="/employees/attendance"
        class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <FileTextIcon class="size-4 text-slate-400" />
          <span class="font-semibold text-slate-800">Live Attendance</span>
        </div>
        <ChevronRightIcon class="size-4 text-slate-400" />
      </RouterLink>

      <RouterLink 
        to="/employees/leaves"
        class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <CalendarDaysIcon class="size-4 text-slate-400" />
          <span class="font-semibold text-slate-800">Request Leave</span>
        </div>
        <ChevronRightIcon class="size-4 text-slate-400" />
      </RouterLink>

      <RouterLink 
        to="/payroll/overtime"
        class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <ClockIcon class="size-4 text-slate-400" />
          <span class="font-semibold text-slate-800">Request Overtime</span>
        </div>
        <ChevronRightIcon class="size-4 text-slate-400" />
      </RouterLink>

      <RouterLink 
        to="/employees?tab=locations"
        class="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors"
      >
        <div class="flex items-center gap-2.5">
          <ShieldCheckIcon class="size-4 text-slate-400" />
          <span class="font-semibold text-slate-800">Company Policy</span>
        </div>
        <ChevronRightIcon class="size-4 text-slate-400" />
      </RouterLink>
    </div>
  </div>
</template>
