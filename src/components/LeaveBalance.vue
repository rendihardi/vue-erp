<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

const openLeaveRequest = () => {
  router.push('/employees/leaves?tab=adjust-balance')
}
</script>

<template>
  <div class="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-sm text-slate-900">Balance Annual Leave</h3>
      <RouterLink to="/employees/leaves" class="text-xs font-semibold text-[#3b52f6] hover:underline">See All</RouterLink>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
      <!-- Colorful Donut Chart -->
      <div class="flex items-center justify-center relative">
        <svg class="size-32 transform -rotate-90" viewBox="0 0 36 36">
          <path
            stroke="#f59e0b"
            stroke-width="4.5"
            stroke-dasharray="25, 100"
            fill="none"
          />
          <path
            stroke="#06b6d4"
            stroke-width="4.5"
            stroke-dasharray="35, 100"
            stroke-dashoffset="-25"
            fill="none"
          />
          <path
            stroke="#3b52f6"
            stroke-width="4.5"
            stroke-dasharray="40, 100"
            stroke-dashoffset="-60"
            fill="none"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center font-mono">
          <span class="text-[10px] text-slate-400 font-sans font-medium">Total</span>
          <span class="text-lg font-black text-slate-900">2157</span>
        </div>
      </div>

      <!-- Stat Info Breakdown -->
      <div class="space-y-3 text-xs">
        <div>
          <span class="block font-black text-slate-900 text-sm font-mono leading-none">10 Days</span>
          <span class="block text-[11px] text-[#3b52f6] font-semibold mt-1">Request annual leave</span>
        </div>
        <div>
          <span class="block font-black text-slate-900 text-sm font-mono leading-none">1 Day</span>
          <span class="block text-[11px] text-slate-400 font-medium mt-1">Leave permission</span>
        </div>
      </div>
    </div>

    <!-- Primary Blue CTA Button -->
    <button
      @click="openLeaveRequest"
      class="w-full bg-[#3b52f6] hover:bg-[#3245d9] text-white font-bold text-xs py-3 rounded-xl transition-colors shadow-sm shadow-[#3b52f6]/30 cursor-pointer"
    >
      Request Permission
    </button>
  </div>
</template>
