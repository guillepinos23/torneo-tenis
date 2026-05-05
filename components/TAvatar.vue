<template>
  <div
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      fontSize: `${Math.round(size * 0.38)}px`,
      color: '#0a0a0a',
      flexShrink: 0,
      border: outline ? '2.5px solid #E8FF4A' : 'none',
      boxShadow: outline ? '0 0 10px rgba(232,255,74,0.4)' : 'none',
      fontFamily: `'Bebas Neue', display`,
    }"
  >
    {{ (name || '?')[0].toUpperCase() }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  name: string
  id: string
  size?: number
  outline?: boolean
}>()

const { getColor } = usePlayerColor()
const color = computed(() => getColor(props.id))
const size = computed(() => props.size ?? 32)
</script>
