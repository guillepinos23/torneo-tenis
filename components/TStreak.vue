<template>
  <div style="display:flex; gap:3px;">
    <div
      v-for="(s, i) in last5"
      :key="i"
      :style="{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: s === 'W' ? '#E8FF4A' : '#ff4c4c',
        boxShadow: `0 0 5px ${s === 'W' ? '#E8FF4A' : '#ff4c4c'}88`,
      }"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ streak: ('W' | 'L')[] }>()
const last5 = computed(() => props.streak.slice(-5))
</script>
