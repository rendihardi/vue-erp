<script setup>
defineProps({
  title: {
    type: String,
    default: 'Gender Diversity'
  },
  items: {
    type: Array,
    default: () => [
      { label: 'Man', count: 10, percent: 20, color: 'bg-amber-500', hex: '#f59e0b' },
      { label: 'Woman', count: 40, percent: 80, color: 'bg-[#3b52f6]', hex: '#3b52f6' }
    ]
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="font-bold text-sm text-slate-900">{{ title }}</h3>
      <button class="text-slate-400 hover:text-slate-600 font-bold text-xs">•••</button>
    </div>

    <div class="flex items-center justify-center py-2 relative">
      <!-- SVG Donut Simulation -->
      <svg class="size-28 transform -rotate-90" viewBox="0 0 36 36">
        <!-- Background Circle -->
        <path
          class="text-slate-100"
          stroke-width="4.5"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Segment 1 (Blue) -->
        <path
          stroke="#3b52f6"
          stroke-width="4.5"
          stroke-dasharray="80, 100"
          stroke-linecap="round"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        <!-- Segment 2 (Orange) -->
        <path
          stroke="#f59e0b"
          stroke-width="4.5"
          stroke-dasharray="20, 100"
          stroke-dashoffset="-80"
          stroke-linecap="round"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
      </svg>
      <!-- Center text -->
      <div class="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-slate-700">
        <span>50% 50%</span>
      </div>
    </div>

    <!-- Legend breakdown -->
    <div class="space-y-2 pt-1 text-xs">
      <div v-for="(item, idx) in items" :key="idx" class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full" :class="item.color"></span>
          <span class="text-slate-600 font-medium">{{ item.label }}</span>
        </div>
        <div class="flex items-center gap-3 font-mono">
          <span class="font-bold text-slate-900">{{ item.count }}</span>
          <span class="text-slate-400 font-normal">({{ item.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>
