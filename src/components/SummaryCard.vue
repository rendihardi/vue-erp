<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  trend: {
    type: String,
    default: ''
  },
  isUp: {
    type: Boolean,
    default: true
  },
  iconBg: {
    type: String,
    default: 'bg-blue-50 text-[#3b52f6]'
  }
})
</script>

<template>
  <div class="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-xs flex items-center justify-between transition-all hover:shadow-md">
    <div class="space-y-1">
      <span class="text-xs font-semibold text-slate-400 block tracking-tight">{{ title }}</span>
      <span class="text-2xl font-black text-slate-900 font-display block tracking-tight">{{ value }}</span>
      <div v-if="trend" class="flex items-center gap-1 text-[11px] font-semibold" :class="isUp ? 'text-emerald-600' : 'text-amber-600'">
        <span>{{ isUp ? '▲' : '▼' }}</span>
        <span>{{ trend }}</span>
      </div>
    </div>

    <!-- Soft Tinted Icon Bubble -->
    <div class="size-12 rounded-2xl flex items-center justify-center shrink-0" :class="iconBg">
      <slot />
    </div>
  </div>
</template>
