<script setup>
defineProps({
  text: {
    type: String,
    default: 'Memuat data...'
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center py-10 space-y-3 font-sans">
    <div class="relative size-10 flex items-center justify-center">
      <div class="absolute inset-0 rounded-full border-3 border-slate-200"></div>
      <div class="absolute inset-0 rounded-full border-3 border-[#3b52f6] border-t-transparent animate-spin"></div>
    </div>
    <span class="text-xs font-semibold text-slate-500 font-mono tracking-tight animate-pulse">{{ text }}</span>
  </div>
</template>
