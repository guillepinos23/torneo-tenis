<template>
  <Teleport to="body">
    <div class="overlay" @click="$emit('close')">
      <div class="modal scale-in" @click.stop>
        <h3>RESULTADO</h3>

        <!-- Jugadores -->
        <div class="players-header">
          <div class="ph-player">
            <TAvatar :name="displayName(p1)" :id="match.p1" :size="36" />
            <span>{{ displayName(p1) }}</span>
          </div>
          <div class="ph-vs">VS</div>
          <div class="ph-player right">
            <TAvatar :name="displayName(p2)" :id="match.p2" :size="36" />
            <span>{{ displayName(p2) }}</span>
          </div>
        </div>

        <!-- Set 1 -->
        <div class="set-row">
          <span class="set-label">SET 1</span>
          <div class="set-inputs">
            <input :value="set1_p1" inputmode="numeric" maxlength="1"
              :class="{ filled: set1_p1 !== '' }" placeholder="–"
              @input="onInput('set1_p1', $event)" @focus="sel" />
            <span class="sep">–</span>
            <input :value="set1_p2" inputmode="numeric" maxlength="1"
              :class="{ filled: set1_p2 !== '' }" placeholder="–"
              @input="onInput('set1_p2', $event)" @focus="sel" />
          </div>
        </div>

        <!-- Set 2 -->
        <div class="set-row">
          <span class="set-label">SET 2</span>
          <div class="set-inputs">
            <input :value="set2_p1" inputmode="numeric" maxlength="1"
              :class="{ filled: set2_p1 !== '' }" placeholder="–"
              @input="onInput('set2_p1', $event)" @focus="sel" />
            <span class="sep">–</span>
            <input :value="set2_p2" inputmode="numeric" maxlength="1"
              :class="{ filled: set2_p2 !== '' }" placeholder="–"
              @input="onInput('set2_p2', $event)" @focus="sel" />
          </div>
        </div>

        <!-- Supertiebreak — solo aparece si hay empate 1-1 -->
        <div v-if="needsTb" class="set-row tb">
          <span class="set-label">SUPER TB</span>
          <div class="set-inputs">
            <input :value="tb_p1" inputmode="numeric" maxlength="2"
              :class="{ filled: tb_p1 !== '' }" placeholder="–"
              @input="onInput('tb_p1', $event)" @focus="sel" />
            <span class="sep">–</span>
            <input :value="tb_p2" inputmode="numeric" maxlength="2"
              :class="{ filled: tb_p2 !== '' }" placeholder="–"
              @input="onInput('tb_p2', $event)" @focus="sel" />
          </div>
        </div>

        <!-- Preview resultado -->
        <div v-if="preview" class="preview">{{ preview }}</div>

        <p class="hint" :class="{ error: validationMsg }">
          {{ validationMsg || 'Introduce los games de cada set' }}
        </p>

        <div class="actions">
          <button class="cancel" @click="$emit('close')">Cancelar</button>
          <button class="save" :disabled="!valid" @click="save">GUARDAR</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Match, Player } from '~/composables/useTorneo'

const props = defineProps<{
  match: Match
  playerMap: Record<string, Player>
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', m: Match): void
}>()

const p1 = computed(() => props.playerMap[props.match.p1])
const p2 = computed(() => props.playerMap[props.match.p2])

function displayName(p?: Player) {
  if (!p) return '?'
  return (p as any).nickname || p.name
}

const set1_p1 = ref(props.match.set1_p1 !== null ? String(props.match.set1_p1) : '')
const set1_p2 = ref(props.match.set1_p2 !== null ? String(props.match.set1_p2) : '')
const set2_p1 = ref(props.match.set2_p1 !== null ? String(props.match.set2_p1) : '')
const set2_p2 = ref(props.match.set2_p2 !== null ? String(props.match.set2_p2) : '')
const tb_p1   = ref(props.match.tb_p1   !== null ? String(props.match.tb_p1)   : '')
const tb_p2   = ref(props.match.tb_p2   !== null ? String(props.match.tb_p2)   : '')

const fields: Record<string, ReturnType<typeof ref>> = {
  set1_p1, set1_p2, set2_p1, set2_p2, tb_p1, tb_p2
}

function onInput(field: string, e: Event) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(-2)
  fields[field].value = val
}

function sel(e: Event) {
  (e.target as HTMLInputElement).select()
}

const n = (v: string) => v !== '' ? parseInt(v) : null

// ¿Hay empate 1-1?
const needsTb = computed(() => {
  const s1p1 = n(set1_p1.value), s1p2 = n(set1_p2.value)
  const s2p1 = n(set2_p1.value), s2p2 = n(set2_p2.value)
  if (s1p1 === null || s1p2 === null || s2p1 === null || s2p2 === null) return false
  const w1 = (s1p1 > s1p2 ? 1 : 0) + (s2p1 > s2p2 ? 1 : 0)
  const w2 = (s1p2 > s1p1 ? 1 : 0) + (s2p2 > s2p1 ? 1 : 0)
  return w1 === 1 && w2 === 1
})

const validationMsg = computed(() => {
  const s1p1 = n(set1_p1.value), s1p2 = n(set1_p2.value)
  const s2p1 = n(set2_p1.value), s2p2 = n(set2_p2.value)
  if (s1p1 !== null && s1p2 !== null && s1p1 === s1p2) return 'Set 1: no puede haber empate'
  if (s2p1 !== null && s2p2 !== null && s2p1 === s2p2) return 'Set 2: no puede haber empate'
  if (needsTb.value) {
    const tp1 = n(tb_p1.value), tp2 = n(tb_p2.value)
    if (tp1 !== null && tp2 !== null && tp1 === tp2) return 'Supertiebreak: no puede haber empate'
  }
  return ''
})

const valid = computed(() => {
  if (validationMsg.value) return false
  const s1p1 = n(set1_p1.value), s1p2 = n(set1_p2.value)
  const s2p1 = n(set2_p1.value), s2p2 = n(set2_p2.value)
  if (s1p1 === null || s1p2 === null || s2p1 === null || s2p2 === null) return false
  if (needsTb.value) {
    const tp1 = n(tb_p1.value), tp2 = n(tb_p2.value)
    if (tp1 === null || tp2 === null || tp1 === tp2) return false
  }
  return true
})

// Calcular ganador
const winner = computed(() => {
  if (!valid.value) return null
  const s1p1 = n(set1_p1.value)!, s1p2 = n(set1_p2.value)!
  const s2p1 = n(set2_p1.value)!, s2p2 = n(set2_p2.value)!
  let w1 = (s1p1 > s1p2 ? 1 : 0) + (s2p1 > s2p2 ? 1 : 0)
  let w2 = (s1p2 > s1p1 ? 1 : 0) + (s2p2 > s2p1 ? 1 : 0)
  if (needsTb.value) {
    const tp1 = n(tb_p1.value)!, tp2 = n(tb_p2.value)!
    if (tp1 > tp2) w1++; else w2++;
  }
  return w1 > w2 ? props.match.p1 : props.match.p2
})

// Preview tipo "6-3 / 4-6 / [10-7]"
const preview = computed(() => {
  const s1p1 = n(set1_p1.value), s1p2 = n(set1_p2.value)
  const s2p1 = n(set2_p1.value), s2p2 = n(set2_p2.value)
  if (s1p1 === null || s1p2 === null) return ''
  let str = `${s1p1}–${s1p2}`
  if (s2p1 !== null && s2p2 !== null) str += ` / ${s2p1}–${s2p2}`
  if (needsTb.value) {
    const tp1 = n(tb_p1.value), tp2 = n(tb_p2.value)
    if (tp1 !== null && tp2 !== null) str += ` / [${tp1}–${tp2}]`
  }
  return str
})

function save() {
  if (!valid.value || !winner.value) return
  emit('save', {
    ...props.match,
    set1_p1: n(set1_p1.value), set1_p2: n(set1_p2.value),
    set2_p1: n(set2_p1.value), set2_p2: n(set2_p2.value),
    tb_p1: needsTb.value ? n(tb_p1.value) : null,
    tb_p2: needsTb.value ? n(tb_p2.value) : null,
    winner: winner.value,
    s1: null, s2: null,
  })
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.88);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
  backdrop-filter: blur(6px);
}
.modal {
  background: #111; border: 1px solid #2a2a2a;
  border-radius: 20px; padding: 28px 24px;
  width: 100%; max-width: 420px;
}
h3 {
  font-family: 'Bebas Neue', display;
  font-size: 1.6rem; color: #E8FF4A;
  letter-spacing: 0.04em; margin-bottom: 20px;
}
.players-header {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 24px;
}
.ph-player {
  flex: 1; display: flex; align-items: center; gap: 8px;
  font-family: 'Space Mono', monospace; font-size: 0.75rem; color: #aaa;
}
.ph-player.right { flex-direction: row-reverse; text-align: right; }
.ph-vs {
  font-family: 'Bebas Neue', display; font-size: 1rem; color: #333;
}
.set-row {
  display: flex; align-items: center; gap: 16px; margin-bottom: 14px;
}
.set-row.tb .set-label { color: #E8FF4A; }
.set-label {
  font-family: 'Space Mono', monospace; font-size: 0.62rem;
  color: #444; width: 56px; flex-shrink: 0; letter-spacing: 0.08em;
}
.set-inputs {
  display: flex; align-items: center; gap: 8px;
}
.set-inputs input {
  width: 52px; height: 58px;
  background: #1a1a1a; border: 1px solid #2a2a2a;
  border-radius: 10px; color: #555;
  font-size: 2rem; font-family: 'Bebas Neue', display;
  text-align: center; outline: none;
  transition: border-color 0.2s, color 0.2s;
  caret-color: transparent;
}
.set-inputs input::placeholder { color: #222; }
.set-inputs input.filled { border-color: #E8FF4A; color: #E8FF4A; }
.set-inputs input:focus { border-color: #E8FF4A88; background: #1e1e1e; }
.sep {
  font-family: 'Bebas Neue', display; font-size: 1.5rem; color: #2a2a2a;
}
.preview {
  text-align: center; font-family: 'Bebas Neue', display;
  font-size: 1.4rem; color: #fff; letter-spacing: 0.05em;
  margin: 12px 0 4px;
}
.hint {
  font-family: 'Space Mono', monospace; font-size: 0.62rem;
  color: #444; margin-bottom: 18px; text-align: center; min-height: 1.2em;
}
.hint.error { color: #ff4c4c; }
.actions { display: flex; gap: 8px; }
.cancel {
  flex: 1; background: transparent; border: 1px solid #2a2a2a;
  border-radius: 10px; padding: 11px; color: #666;
  font-family: 'Space Mono', monospace; font-size: 0.8rem; cursor: pointer;
}
.save {
  flex: 2; border: none; border-radius: 10px; padding: 11px;
  font-family: 'Bebas Neue', display; font-size: 1.1rem;
  letter-spacing: 0.04em; cursor: pointer;
  background: #E8FF4A; color: #0a0a0a; transition: background 0.2s;
}
.save:disabled { background: #1e1e1e; color: #333; cursor: not-allowed; }
.save:not(:disabled):hover { background: #d4eb30; }
</style>