<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  total: {
    type: [Number, String],
    default: 50
  },
  segments: {
    type: Array,
    default: () => [
      { label: 'Permanent', count: 10, percent: 20, color: 'bg-amber-500' },
      { label: 'Contract', count: 40, percent: 80, color: 'bg-[#3b52f6]' }
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

    <div class="flex items-center justify-between text-xs font-semibold text-slate-400">
      <span>Total</span>
      <span class="font-bold text-slate-900 font-mono">{{ total }}</span>
    </div>

    <!-- Segmented Progress Bar -->
    <div class="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5">
      <div 
        v-for="(seg, idx) in segments" 
        :key="idx"
        class="h-full rounded-full transition-all"
        :class="seg.color"
        :style="{ width: `${seg.percent}%` }"
      ></div>
    </div>

    <!-- Legend breakdown -->
    <div class="space-y-2 pt-1 text-xs">
      <div v-for="(seg, idx) in segments" :key="idx" class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="size-2 rounded-full" :class="seg.color"></span>
          <span class="text-slate-600 font-medium">{{ seg.label }}</span>
        </div>
        <div class="flex items-center gap-3 font-mono">
          <span class="font-bold text-slate-900">{{ seg.count }}</span>
          <span class="text-slate-400 font-normal">({{ seg.percent }}%)</span>
        </div>
      </div>
    </div>
  </div>
</template>
