<template>
  <div class="app">
    <!-- Top accent bar -->
    <div class="top-bar" />

    <!-- Sync indicator -->
    <div class="sync-corner">
      <TSyncDot :syncing="syncing" />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-screen">
      <span class="spin-ico" style="font-size:2.5rem">🎾</span>
      <p>Conectando...</p>
    </div>

    <template v-else>
      <!-- ── REGISTRO ── -->
      <div v-if="tournament?.phase === 'registro'" class="phase-wrap">
        <div class="reg-header">
          <div class="bounce-ico" style="font-size:3rem">🎾</div>
          <h1 class="main-title">OPEN CLASE</h1>
          <p class="subtitle">Torneo todos contra todos &middot; Apúntate para jugar</p>
          <div class="draw-date-box">
            <span class="draw-date-label">🗓 SORTEO</span>
            <template v-if="isAdmin">
              <input v-model="drawDate" class="draw-date-input" placeholder="Ej: Viernes 9 a las 18:00" />
            </template>
            <span v-else class="draw-date-text">{{ drawDate }}</span>
          </div>
        </div>

        <!-- Input registro -->
        <div class="card mb-20">
          <div class="input-row">
            <input
              v-model="newName"
              placeholder="Tu nombre..."
              @keydown.enter="handleAddPlayer"
            />
            <button class="btn-primary" :disabled="!newName.trim()" @click="handleAddPlayer">
              ENTRAR
            </button>
          </div>
          <input
            v-model="newNickname"
            class="nickname-input"
            placeholder="Mote opcional..."
            @keydown.enter="handleAddPlayer"
          />
          <p v-if="regError" class="reg-error">{{ regError }}</p>
        </div>

        <!-- Lista jugadores -->
        <div v-if="players.length" class="mb-20">
          <div class="list-header">
            <span class="mono-label">INSCRITOS · {{ players.length }} / 12</span>
            <button v-if="isAdmin && players.length >= 3" class="btn-outline" @click="handleLaunchDraw">
              LANZAR SORTEO →
            </button>
          </div>
          <div class="player-list">
            <div
              v-for="p in players"
              :key="p.id"
              class="player-row slide-up"
            >
              <TAvatar :name="p.name" :id="p.id" :size="28" />
              <div class="player-name-block">
                <span class="player-name-text">{{ p.nickname || p.name }}</span>
                <span v-if="p.nickname" class="player-real-name">{{ p.name }}</span>
              </div>
              <button v-if="isAdmin" class="remove-btn" @click="removePlayer(p.id)">✕</button>
            </div>
          </div>
        </div>

        <p v-if="players.length < 3" class="hint-text">
          Mínimo 3 jugadores para empezar
        </p>

        <!-- Admin link / badge -->
        <div style="text-align:center; margin-top:28px">
          <TPill v-if="isAdmin" color="#E8FF4A">ADMIN ACTIVO</TPill>
          <button v-else class="admin-link" @click="showAdminGate = true">
            Acceso admin
          </button>
        </div>
      </div>

     <!-- ── SORTEO ── -->
<div v-else-if="tournament?.phase === 'sorteo'" class="phase-wrap">
  <div style="text-align:center; margin-bottom:32px">
    <div class="bounce-ico" style="font-size:2.5rem">🎲</div>
    <h1 class="draw-title">SORTEO EN<br>DIRECTO</h1>
    <p class="subtitle">
      {{ matches.length }} partidos · {{ allRounds.length }} jornadas · {{ players.length }} jugadores
    </p>
  </div>

  <!-- Animación partido actual (solo jornada 1) -->
  <div v-if="animating" class="duel-stage">
    <div class="duel-name left" :class="{ fly: animStep >= 1 }">{{ duelP1 }}</div>
    <div class="duel-center" :class="{ show: animStep >= 2 }">
      <div class="duel-vs">VS</div>
    </div>
    <div class="duel-name right" :class="{ fly: animStep >= 1 }">{{ duelP2 }}</div>
    <div class="duel-result" :class="{ show: animStep >= 3 }">
      {{ duelP1 }} vs {{ duelP2 }}
    </div>
  </div>

  <!-- Admin controls -->
  <div v-if="isAdmin && !animating" style="display:flex; gap:8px; justify-content:center; margin-bottom:28px; flex-wrap:wrap">
    <button
      v-if="!allRevealed"
      class="btn-primary"
      @click="handleReveal"
    >
      ▶ {{ nextIsRound1 ? 'REVELAR SIGUIENTE PARTIDO' : 'REVELAR SIGUIENTE JORNADA' }}
    </button>
    <button v-else class="btn-primary pulse-btn" @click="finishDraw">
      ¡COMENZAR TORNEO! 🏆
    </button>
  </div>
  <p v-else-if="!isAdmin && !animating" style="text-align:center; font-family:'Space Mono',monospace; font-size:0.7rem; color:#555; margin-bottom:24px">
    {{ allRevealed ? '✅ Sorteo completado — esperando al admin...' : '⏳ Esperando al admin...' }}
  </p>

  <!-- Cuadro revelado -->
  <div class="rounds-list">
    <div
      v-for="round in allRounds"
      :key="round"
      class="round-block"
      :class="{ revealed: isRoundRevealed(round) }"
    >
      <div class="round-divider">
        <div class="divider-line" />
        <span class="round-label">JORNADA {{ round }}</span>
        <div class="divider-line" />
      </div>
      <div class="matches-col">
        <TMatchRow
          v-for="m in visibleMatchesForRound(round)"
          :key="m.id"
          :match="m"
          :player-map="playerMap"
          :on-click="null"
        />
      </div>
    </div>
  </div>
</div>

      <!-- ── TORNEO ── -->
      <div v-else-if="tournament?.phase === 'torneo'" class="phase-wrap wide">
        <!-- Header -->
        <div class="torneo-header">
          <div>
            <h1 class="torneo-title">OPEN CLASE 🎾</h1>
            <div class="torneo-meta">
              <div class="meta-block">
                <span class="meta-big">{{ daysLeft }}</span>
                <span class="meta-small">días restantes</span>
              </div>
              <div class="meta-divider" />
              <div class="meta-block">
                <span class="meta-big">28 JUN</span>
                <span class="meta-small">fecha fin</span>
              </div>
            </div>
            <p class="torneo-subtitle">{{ doneMatches }} / {{ totalMatches }} partidos · {{ players.length }} jugadores</p>
          </div>
          <button v-if="isAdmin" class="btn-reset" @click="handleReset">↩ RESET</button>
          <button v-else class="btn-reset" @click="showAdminGate = true">🔐 ACCEDER ADMIN</button>
        </div>

        <!-- Progress bar -->
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progress}%` }" />
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="tab-btn"
            :class="{ active: activeTab === t.id }"
            @click="activeTab = t.id"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- TABLA -->
        <div v-if="activeTab === 'tabla'">
          <div class="tabla-header-row">
            <span v-for="h in ['#','JUGADOR','PTS','PJ','V','SETS']" :key="h" class="th" :class="{ left: h === 'JUGADOR' }">{{ h }}</span>
          </div>
          <div class="tabla-rows">
            <div
              v-for="(s, i) in standings"
              :key="s.id"
              class="tabla-row"
              :class="{ leader: i === 0 }"
              @click="selectedPlayer = players.find(p => p.id === s.id) ?? null"
            >
              <span class="rank" :class="{ gold: i === 0 }">{{ i + 1 }}</span>
              <div class="player-cell">
                <TAvatar :name="s.name" :id="s.id" :size="24" />
                <div>
                  <div class="tabla-name">{{ s.nickname || s.name }}</div>
                  <TStreak :streak="s.streak" />
                </div>
              </div>
              <div class="td accent">{{ s.pts }}</div>
              <div class="td muted">{{ s.pj }}</div>
              <div class="td">{{ s.v }}</div>
              <div class="td muted small">{{ s.sw }}-{{ s.sl }}</div>
            </div>
          </div>
        </div>

        <!-- PARTIDOS -->
        <div v-else-if="activeTab === 'partidos'">
          <div v-for="round in allRounds" :key="round" class="round-block revealed" style="margin-bottom:18px">
            <div class="round-divider">
              <div class="divider-line" />
              <span class="round-label">JORNADA {{ round }}</span>
              <div class="divider-line" />
            </div>
            <div class="matches-col">
              <TMatchRow
                v-for="m in byRound[round]"
                :key="m.id"
                :match="m"
                :player-map="playerMap"
                :on-click="(m) => selectedMatch = m"
              />
            </div>
          </div>
        </div>

        <!-- JUGADORES -->
        <div v-else-if="activeTab === 'jugadores'" class="players-grid">
          <div
            v-for="(s, i) in standings"
            :key="s.id"
            class="player-card"
            @click="selectedPlayer = players.find(p => p.id === s.id) ?? null"
          >
            <TAvatar :name="s.name" :id="s.id" :size="42" :outline="i === 0 && s.pj > 0" />
            <div class="card-name">{{ s.name }}</div>
            <div class="card-pts">{{ s.pts }} <span class="pts-label">pts</span></div>
            <TStreak :streak="s.streak" />
            <TPill v-if="i === 0 && s.pj > 0" style="margin-top:8px">Líder</TPill>
          </div>
        </div>
      </div>
    </template>

    <!-- Modals -->
    <AdminGate v-if="showAdminGate" @unlocked="showAdminGate = false" @close="showAdminGate = false" />

    <ResultModal
      v-if="selectedMatch"
      :match="selectedMatch"
      :player-map="playerMap"
      @close="selectedMatch = null"
      @save="handleSaveResult"
    />

    <PlayerProfile
      v-if="selectedPlayer"
      :player="selectedPlayer"
      :players="players"
      :matches="matches"
      :player-map="playerMap"
      @close="selectedPlayer = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Match, Player } from '~/composables/useTorneo'

const {
  tournament, players, matches, loading, syncing,
  standings, byRound, totalMatches, doneMatches, progress,
  allRounds, allRevealed, playerMap,
  addPlayer, removePlayer, launchDraw,
  revealNextRound, finishDraw, saveMatchResult, resetTorneo,
} = useTorneo()

const { isAdmin } = useAdmin()

const showAdminGate = ref(false)
const drawDate = ref('Miercoles 6 de Mayo a las 23:15')
const endDate = new Date('2025-06-28')
const daysLeft = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
})
const newName = ref('')
const newNickname = ref('')
const regError = ref('')
const activeTab = ref<'tabla' | 'partidos' | 'jugadores'>('tabla')
const selectedMatch = ref<Match | null>(null)
const selectedPlayer = ref<Player | null>(null)

 // Animación sorteo
const animating = ref(false)
const animStep = ref(0)
const duelP1 = ref('')
const duelP2 = ref('')
const revealedMatchIds = ref<number[]>([])

// Índice del siguiente partido de jornada 1 a animar
const round1Matches = computed(() => byRound.value[1] ?? [])
const nextRound1Index = computed(() => round1Matches.value.findIndex(m => !revealedMatchIds.value.includes(m.id)))
const round1Done = computed(() => nextRound1Index.value === -1)
const nextIsRound1 = computed(() => {
  const revealed = tournament.value?.revealed_rounds ?? []
  return !revealed.includes(1) || (revealed.includes(1) && !round1Done.value)
})

function isRoundRevealed(round: number) {
  const revealed = tournament.value?.revealed_rounds ?? []
  if (round !== 1) return revealed.includes(round)
  // Jornada 1: solo mostrar los partidos ya animados
  return round1Done.value && revealed.includes(1)
}

function visibleMatchesForRound(round: number) {
  if (round !== 1) return byRound.value[round] ?? []
  return (byRound.value[1] ?? []).filter(m => revealedMatchIds.value.includes(m.id))
}

async function handleReveal() {
  if (animating.value) return
  const revealed = tournament.value?.revealed_rounds ?? []

  // Si jornada 1 no está revelada aún o quedan partidos por animar
  if (!revealed.includes(1) || !round1Done.value) {
    const idx = nextRound1Index.value
    if (idx === -1) return
    const match = round1Matches.value[idx]
    const p1name = (playerMap.value[match.p1] as any)?.nickname || playerMap.value[match.p1]?.name || '?'
    const p2name = (playerMap.value[match.p2] as any)?.nickname || playerMap.value[match.p2]?.name || '?'

    // Lanzar animación
    duelP1.value = p1name
    duelP2.value = p2name
    animating.value = true
    animStep.value = 0

    await delay(200)
    animStep.value = 1  // vuelan hacia el centro
    await delay(900)
    animStep.value = 2  // aparece VS
    await delay(600)
    animStep.value = 3  // resultado final
    await delay(1000)

    // Añadir al cuadro
    revealedMatchIds.value.push(match.id)
    animating.value = false
    animStep.value = 0

    // Si era el último partido de jornada 1, marcarla como revelada en Supabase
    if (nextRound1Index.value === -1) {
      await revealNextRound()
    }
    return
  }

  // Jornadas 2+ → revelar directamente
  await revealNextRound()
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
const tabs = [
  { id: 'tabla', label: 'TABLA' },
  { id: 'partidos', label: 'PARTIDOS' },
  { id: 'jugadores', label: 'JUGADORES' },
]

async function handleAddPlayer() {
  const name = newName.value.trim()
  if (!name) return
  const error = await addPlayer(name, newNickname.value.trim() || undefined)
  if (error) { regError.value = error; return }
  newName.value = ''
  newNickname.value = ''
  regError.value = ''
}

async function handleLaunchDraw() {
  await launchDraw()
}

async function handleSaveResult(updated: Match) {
  await saveMatchResult(updated)
  selectedMatch.value = null
}

async function handleReset() {
  if (window.confirm('¿Reiniciar el torneo completo? Se borrarán todos los datos.')) {
    await resetTorneo()
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #0a0a0a;
  padding-top: 36px;
  padding-bottom: 60px;
}

/* Top accent */
.top-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, #E8FF4A 25%, #E8FF4A 75%, transparent);
  opacity: 0.7; z-index: 200;
}

.sync-corner {
  position: fixed; top: 8px; right: 12px; z-index: 199;
}

/* Loading */
.loading-screen {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 80vh; gap: 12px;
}
.loading-screen p {
  font-family: 'Space Mono', monospace; color: #444; font-size: 0.75rem;
}

/* Phase wrapper */
.phase-wrap {
  max-width: 580px;
  margin: 0 auto;
  padding: 0 16px;
}
.phase-wrap.wide { max-width: 740px; }

/* Registro header */
.reg-header { text-align: center; margin-bottom: 32px; }
.main-title {
  font-family: 'Bebas Neue', display;
  font-size: clamp(3rem, 10vw, 5rem);
  letter-spacing: 0.04em;
  background: linear-gradient(135deg, #E8FF4A, #9abb00);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0; line-height: 1;
}
.draw-title {
  font-family: 'Bebas Neue', display;
  font-size: clamp(2.8rem, 9vw, 4.5rem);
  letter-spacing: 0.04em; color: #E8FF4A;
  margin: 8px 0 0; line-height: 0.95;
}
.subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.7rem; color: #555; margin-top: 8px;
}

/* Card */
.card {
  background: #111; border: 1px solid #1e1e1e;
  border-radius: 16px; padding: 20px;
}
.mb-20 { margin-bottom: 20px; }

/* Input row */
.input-row { display: flex; gap: 8px; }
input[type=text], input:not([type=number]) {
  flex: 1; background: #181818; border: 1px solid #2a2a2a;
  border-radius: 10px; padding: 11px 14px; color: #fff;
  font-family: 'Space Mono', monospace; font-size: 0.85rem; outline: none;
}
.nickname-input {
  width: 100%; margin-top: 8px;
  background: #181818; border: 1px solid #2a2a2a;
  border-radius: 10px; padding: 9px 14px; color: #aaa;
  font-family: 'Space Mono', monospace; font-size: 0.75rem; outline: none;
  transition: border-color 0.2s;
}
.nickname-input::placeholder { color: #666; }
.nickname-input:focus { border-color: #333; }
.player-name-block { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.player-real-name { font-family: 'Space Mono', monospace; font-size: 0.58rem; color: #444; }
.reg-error {
  color: #ff4c4c; font-family: 'Space Mono', monospace;
  font-size: 0.7rem; margin-top: 8px;
}

/* Buttons */
.btn-primary {
  background: #E8FF4A; color: #0a0a0a; border: none;
  border-radius: 10px; padding: 11px 18px;
  font-family: 'Bebas Neue', display; font-size: 1.1rem;
  letter-spacing: 0.04em; cursor: pointer; font-weight: 800;
  white-space: nowrap;
  transition: background 0.2s;
}
.btn-primary:hover:not(:disabled) { background: #d4eb30; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-outline {
  background: transparent; border: 1px solid #E8FF4A; color: #E8FF4A;
  border-radius: 8px; padding: 6px 14px;
  font-family: 'Bebas Neue', display; font-size: 0.95rem;
  letter-spacing: 0.04em; cursor: pointer;
}
.btn-reset {
  background: transparent; border: 1px solid #222; border-radius: 8px;
  padding: 6px 12px; color: #444;
  font-family: 'Space Mono', monospace; font-size: 0.6rem; cursor: pointer;
}

/* Player list */
.list-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.mono-label {
  font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #444;
}
.player-list { display: flex; flex-direction: column; gap: 7px; }
.player-row {
  background: #111; border: 1px solid #1e1e1e; border-radius: 10px;
  padding: 11px 14px; display: flex; align-items: center; gap: 10px;
}
.player-name-text {
  flex: 1; font-family: 'Space Mono', monospace; font-size: 0.82rem; color: #ddd;
}
.remove-btn {
  background: none; border: none; color: #333; cursor: pointer; font-size: 1rem; padding: 4px;
}
.hint-text {
  text-align: center; font-family: 'Space Mono', monospace;
  font-size: 0.68rem; color: #333;
}
.admin-link {
  background: none; border: none; color: #333;
  font-family: 'Space Mono', monospace; font-size: 0.65rem;
  cursor: pointer; text-decoration: underline;
}

/* Draw / Rounds */
.rounds-list { display: flex; flex-direction: column; gap: 22px; }
.round-block {
  opacity: 0.12;
  transform: translateY(12px) scale(0.98);
  transition: all 0.55s cubic-bezier(.22,1,.36,1);
}
.round-block.revealed { opacity: 1; transform: none; }

.round-divider {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.divider-line { flex: 1; height: 1px; background: #1e1e1e; }
.round-label {
  font-family: 'Space Mono', monospace; font-size: 0.78rem;
  color: #777; letter-spacing: 0.1em; white-space: nowrap;
}
.matches-col { display: flex; flex-direction: column; gap: 7px; }

/* Torneo header */
.torneo-header {
  display: flex; align-items: flex-end; justify-content: space-between;
  margin-bottom: 16px;
}
.torneo-title {
  font-family: 'Bebas Neue', display;
  font-size: clamp(2rem, 7vw, 3.2rem);
  letter-spacing: 0.04em; color: #E8FF4A; margin: 0; line-height: 1;
}
.torneo-subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 0.82rem;
  color: #888;
  margin: 6px 0 0;
  letter-spacing: 0.04em;
}

/* Progress */
.progress-track {
  height: 3px; background: #1a1a1a; border-radius: 2px;
  margin-bottom: 20px; overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #E8FF4A, #a8c400);
  border-radius: 2px; transition: width 0.6s ease;
}

/* Tabs */
.tabs {
  display: flex; gap: 3px;
  background: #111; border-radius: 12px; padding: 4px;
  margin-bottom: 20px;
}
.tab-btn {
  flex: 1; background: transparent; border: none; border-radius: 9px;
  padding: 10px 4px; color: #555;
  font-family: 'Bebas Neue', display; font-size: 0.9rem;
  letter-spacing: 0.05em; cursor: pointer; transition: all 0.18s;
}
.tab-btn.active { background: #E8FF4A; color: #0a0a0a; }

/* Tabla */
.tabla-header-row {
  display: grid;
  grid-template-columns: 22px 1fr 44px 44px 44px 52px;
  gap: 8px; padding: 4px 12px; margin-bottom: 6px;
}
.th {
  font-family: 'Space Mono', monospace; font-size: 0.72rem;
  color: #666; text-align: center;
}
.th.left { text-align: left; }
.tabla-rows { display: flex; flex-direction: column; gap: 5px; }
.tabla-row {
  display: grid;
  grid-template-columns: 22px 1fr 44px 44px 44px 52px;
  gap: 8px; padding: 11px 12px;
  background: #111; border: 1px solid #1e1e1e;
  border-radius: 12px; align-items: center;
  cursor: pointer; transition: border-color 0.2s;
}
.tabla-row:hover { border-color: #E8FF4A; }
.tabla-row.leader { background: rgba(232,255,74,0.04); border-color: rgba(232,255,74,0.15); }
.rank { font-family: 'Bebas Neue', display; font-size: 1.1rem; color: #333; }
.rank.gold { color: #E8FF4A; }
.player-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
.tabla-name {
  font-family: 'Space Mono', monospace; font-size: 0.76rem; color: #ddd;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.td { font-family: 'Space Mono', monospace; font-size: 0.7rem; text-align: center; color: #888; }
.td.accent { font-family: 'Bebas Neue', display; font-size: 1.3rem; color: #E8FF4A; }
.td.muted  { color: #555; }
.td.small  { font-size: 0.62rem; color: #555; }

/* Players grid */
.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
  gap: 10px;
}
.player-card {
  background: #111; border: 1px solid #1e1e1e; border-radius: 14px;
  padding: 16px 14px; cursor: pointer;
  display: flex; flex-direction: column;
  transition: border-color 0.2s, transform 0.15s;
}
.player-card:hover { border-color: #E8FF4A; transform: translateY(-2px); }
.card-name {
  font-family: 'Space Mono', monospace; font-size: 0.76rem;
  color: #ddd; margin: 10px 0 6px;
}
.card-pts {
  font-family: 'Bebas Neue', display; font-size: 1.4rem; color: #E8FF4A; margin-bottom: 6px;
}
.pts-label { font-size: 0.9rem; color: #555; }
/* ── Duel animation ── */
.duel-stage {
  position: relative;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  overflow: hidden;
}

.duel-name {
  position: absolute;
  font-family: 'Bebas Neue', display;
  font-size: clamp(1.4rem, 5vw, 2.5rem);
  color: #fff;
  letter-spacing: 0.05em;
  filter: blur(8px);
  opacity: 0;
  transition: all 0.8s cubic-bezier(.22,1,.36,1);
  white-space: nowrap;
  max-width: 35%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.duel-name.left  { left: -100%; }
.duel-name.right { right: -100%; }
.duel-name.left.fly  { left: 5%; filter: blur(0px); opacity: 1; }
.duel-name.right.fly { right: 5%; filter: blur(0px); opacity: 1; }


.duel-center {
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}
.duel-center.show { opacity: 1; }

.duel-vs {
  font-family: 'Bebas Neue', display;
  font-size: 2.5rem;
  color: #E8FF4A;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(232,255,74,0.8);
}

.duel-result {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  text-align: center;
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem;
  color: #666;
  opacity: 0;
  transform: translateY(6px);
  transition: all 0.4s ease;
}
.duel-result.show { opacity: 1; transform: translateY(0); }
.draw-date-box {
  display: flex; align-items: center; gap: 10px;
  background: rgba(232,255,74,0.06);
  border: 1px solid rgba(232,255,74,0.2);
  border-radius: 10px; padding: 10px 16px;
  margin-top: 16px;
}
.draw-date-label {
  font-family: 'Space Mono', monospace;
  font-size: 0.65rem; color: #E8FF4A;
  letter-spacing: 0.08em; flex-shrink: 0;
}
.draw-date-text {
  font-family: 'Space Mono', monospace;
  font-size: 0.8rem; color: #ddd;
}
.draw-date-input {
  flex: 1; background: transparent; border: none;
  color: #fff; font-family: 'Space Mono', monospace;
  font-size: 0.8rem; outline: none;
}
.torneo-meta {
  display: flex; align-items: center; gap: 20px; margin: 8px 0 4px;
}
.meta-block {
  display: flex; flex-direction: column; gap: 2px;
}
.meta-big {
  font-family: 'Bebas Neue', display;
  font-size: 2.2rem; color: #E8FF4A; line-height: 1;
}
.meta-small {
  font-family: 'Space Mono', monospace;
  font-size: 0.6rem; color: #555; letter-spacing: 0.06em;
}
.meta-divider {
  width: 1px; height: 40px; background: #2a2a2a;
}
</style>
