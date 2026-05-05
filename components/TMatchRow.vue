<template>
  <div
    class="match-row"
    :class="{ clickable: !!onClick, done: match.winner }"
    @click="onClick && onClick(match)"
  >
    <div v-if="match.winner" class="done-bar" />

    <!-- Player 1 -->
    <div class="player-slot">
      <TAvatar :name="dn(p1)" :id="match.p1" :size="28" :outline="won1" />
      <span class="player-name" :class="{ winner: won1, loser: won2 }">{{ dn(p1) }}</span>
    </div>

    <!-- Centro: score o VS -->
    <div class="center-score">
      <span v-if="match.winner" class="score-detail">{{ scoreDetail }}</span>
      <span v-else class="vs-label">VS</span>
    </div>

    <!-- Player 2 -->
    <div class="player-slot reverse">
      <TAvatar :name="dn(p2)" :id="match.p2" :size="28" :outline="won2" />
      <span class="player-name" :class="{ winner: won2, loser: won1 }">{{ dn(p2) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Match, Player } from '~/composables/useTorneo'

const props = defineProps<{
  match: Match
  playerMap: Record<string, Player>
  onClick?: ((m: Match) => void) | null
}>()

const p1 = computed(() => props.playerMap[props.match.p1])
const p2 = computed(() => props.playerMap[props.match.p2])
const won1 = computed(() => props.match.winner === props.match.p1)
const won2 = computed(() => props.match.winner === props.match.p2)

function dn(p?: { name: string; nickname?: string }) {
  return p?.nickname || p?.name || '?'
}

const scoreDetail = computed(() => {
  if (!props.match.winner) return ''
  const { set1_p1, set1_p2, set2_p1, set2_p2, tb_p1, tb_p2 } = props.match
  if (set1_p1 === null) return `${props.match.s1}–${props.match.s2}`
  let str = `${set1_p1}–${set1_p2} / ${set2_p1}–${set2_p2}`
  if (tb_p1 !== null) str += ` / [${tb_p1}–${tb_p2}]`
  return str
})
</script>

<style scoped>
.match-row {
  background: #111;
  border: 1px solid #1e1e1e;
  border-radius: 13px;
  padding: 13px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s;
}
.match-row.clickable { cursor: pointer; }
.match-row.clickable:hover { border-color: #E8FF4A; transform: translateY(-1px); }
.match-row.done { border-color: #222; }

.done-bar {
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, #E8FF4A, #a8c400);
}

.player-slot {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.player-slot.reverse { flex-direction: row-reverse; }

.player-name {
  font-family: 'Space Mono', monospace;
  font-size: 0.78rem;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.player-name.winner { color: #E8FF4A; font-weight: 700; }
.player-name.loser  { color: #555; }

.center-score {
  flex-shrink: 0;
  text-align: center;
  min-width: 90px;
}
.score-detail {
  font-family: 'Space Mono', monospace;
  font-size: 0.75rem;
  color: #ccc;
  white-space: nowrap;
  font-weight: 700;
  letter-spacing: 0.03em;
}
.vs-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.58rem;
  color: #333;
}
</style>
