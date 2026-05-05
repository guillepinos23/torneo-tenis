<template>
  <span
    :style="{
      background: color + '22',
      color,
      border: `1px solid ${color}44`,
      fontSize: '0.58rem',
      fontWeight: 700,
      padding: '2px 8px',
      borderRadius: '20px',
      fontFamily: `'Space Mono', monospace`,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
    }"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
defineProps<{ color?: string }>()
const color = computed(() => (getCurrentInstance()?.props.color as string) ?? '#E8FF4A')
</script>
