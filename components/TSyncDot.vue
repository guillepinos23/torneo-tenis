<template>
  <div style="display:flex; align-items:center; gap:5px;">
    <div
      :style="{
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        background: syncing ? '#E8FF4A' : '#2a2a2a',
        transition: 'background 0.3s',
        boxShadow: syncing ? '0 0 8px #E8FF4A' : 'none',
      }"
    />
    <span style="font-family:'Space Mono',monospace; font-size:0.58rem; color:#444;">
      {{ syncing ? 'SYNC' : 'EN VIVO' }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{ syncing: boolean }>()
</script>
