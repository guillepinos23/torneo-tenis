<template>
  <Teleport to="body">
    <div class="overlay" @click="$emit('close')">
      <div class="modal scale-in" @click.stop>
        <!-- Header -->
        <div class="header">
          <TAvatar :name="player.name" :id="player.id" :size="54" :outline="stats.v > 0" />
          <div>
            <h2>{{ player.name }}</h2>
            <TStreak :streak="stats.streak" />
          </div>
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <!-- Stats grid -->
        <div class="stats-grid">
          <div v-for="s in statCells" :key="s.label" class="stat-cell">
            <div class="stat-val" :class="{ accent: s.accent }">{{ s.val }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>

        <!-- Historial -->
        <template v-if="history.length">
          <p class="section-label">HISTORIAL RECIENTE</p>
          <div class="list">
            <div v-for="h in history" :key="h.id" class="list-row">
              <div class="dot" :class="h.won ? 'win' : 'loss'" />
              <span class="opp-name">vs {{ h.opp }}</span>
              <span class="score" :class="h.won ? 'win' : 'loss'">{{ h.my }}–{{ h.op }}</span>
            </div>
          </div>
        </template>

        <!-- Próximos -->
        <template v-if="pending.length">
          <p class="section-label" style="margin-top:16px">PRÓXIMOS</p>
          <div class="list">
            <div v-for="m in pending.slice(0,4)" :key="m.id" class="list-row">
              <span class="round-badge">J{{ m.round }}</span>
              <span class="opp-name">vs {{ playerMap[m.p1 === player.id ? m.p2 : m.p1]?.name }}</span>
              <TPill>pendiente</TPill>
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Player, Match } from '~/composables/useTorneo'

const props = defineProps<{
  player: Player
  players: Player[]
  matches: Match[]
  playerMap: Record<string, Player>
}>()
defineEmits(['close'])

const mine = computed(() => props.matches.filter(m => m.winner && (m.p1 === props.player.id || m.p2 === props.player.id)))
const pending = computed(() => props.matches.filter(m => !m.winner && (m.p1 === props.player.id || m.p2 === props.player.id)))

const stats = computed(() => {
  const v = mine.value.filter(m => m.winner === props.player.id).length
  const sw = mine.value.reduce((a, m) => a + (m.p1 === props.player.id ? (m.s1 ?? 0) : (m.s2 ?? 0)), 0)
  const sl = mine.value.reduce((a, m) => a + (m.p1 === props.player.id ? (m.s2 ?? 0) : (m.s1 ?? 0)), 0)
  const streak = mine.value.slice(-5).map(m => m.winner === props.player.id ? 'W' : 'L') as ('W' | 'L')[]
  return { pj: mine.value.length, v, d: mine.value.length - v, sw, sl, streak }
})

const statCells = computed(() => [
  { label: 'PJ', val: stats.value.pj },
  { label: 'V', val: stats.value.v, accent: true },
  { label: 'D', val: stats.value.d },
  { label: 'SETS', val: `${stats.value.sw}-${stats.value.sl}` },
])

const history = computed(() =>
  mine.value.slice(-5).reverse().map(m => {
    const oppId = m.p1 === props.player.id ? m.p2 : m.p1
    return {
      id: m.id,
      opp: props.playerMap[oppId]?.name ?? '?',
      won: m.winner === props.player.id,
      my: m.p1 === props.player.id ? m.s1 : m.s2,
      op: m.p1 === props.player.id ? m.s2 : m.s1,
    }
  })
)
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
  backdrop-filter: blur(8px);
}
.modal {
  background: #111; border: 1px solid #2a2a2a;
  border-radius: 22px; padding: 26px;
  width: 100%; max-width: 440px;
  max-height: 82vh; overflow-y: auto;
}
.header {
  display: flex; align-items: center; gap: 14px; margin-bottom: 22px;
}
h2 {
  font-family: 'Bebas Neue', display;
  font-size: 2rem; letter-spacing: 0.04em;
  color: #fff; margin: 0 0 4px;
}
.close-btn {
  margin-left: auto; background: none; border: none;
  color: #444; font-size: 1.2rem; cursor: pointer;
  align-self: flex-start;
}
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 8px; margin-bottom: 20px;
}
.stat-cell {
  background: #181818; border-radius: 10px;
  padding: 12px 6px; text-align: center;
}
.stat-val {
  font-family: 'Bebas Neue', display; font-size: 1.7rem; color: #fff;
}
.stat-val.accent { color: #E8FF4A; }
.stat-label {
  font-family: 'Space Mono', monospace; font-size: 0.58rem; color: #444;
}
.section-label {
  font-family: 'Space Mono', monospace; font-size: 0.62rem;
  color: #444; margin-bottom: 8px;
}
.list { display: flex; flex-direction: column; gap: 6px; }
.list-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; background: #181818; border-radius: 8px;
}
.dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dot.win  { background: #E8FF4A; }
.dot.loss { background: #ff4c4c; }
.opp-name {
  flex: 1; font-family: 'Space Mono', monospace;
  font-size: 0.72rem; color: #888;
}
.score {
  font-family: 'Bebas Neue', display; font-size: 1.1rem;
}
.score.win  { color: #E8FF4A; }
.score.loss { color: #ff4c4c; }
.round-badge {
  font-family: 'Space Mono', monospace; font-size: 0.6rem; color: #444;
}
</style>
