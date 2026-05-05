// composables/useTorneo.ts
import type { RealtimeChannel } from '@supabase/supabase-js'

export interface Player {
  nickname?: string   // mote opcional
  id: string
  name: string
  created_at?: string
}
export interface Match {
  id: number
  round: number
  p1: string
  p2: string
  s1: number | null
  s2: number | null
  winner: string | null
  set1_p1: number | null
  set1_p2: number | null
  set2_p1: number | null
  set2_p2: number | null
  tb_p1: number | null
  tb_p2: number | null
  updated_at?: string
}

export interface Tournament {
  id: string
  phase: 'registro' | 'sorteo' | 'torneo'
  revealed_rounds: number[]
}

export interface Standing {
  id: string
  name: string
  nickname?: string
  pts: number
  pj: number
  v: number
  d: number
  sw: number
  sl: number
  streak: ('W' | 'L')[]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateRoundRobin(players: Player[]): Omit<Match, 'updated_at'>[] {
  const list = [...players]
  if (list.length % 2 !== 0) list.push({ id: 'bye', name: 'BYE' })
  const n = list.length
  const matches: Omit<Match, 'updated_at'>[] = []
  let id = 0
  for (let r = 0; r < n - 1; r++) {
    for (let i = 0; i < n / 2; i++) {
      const p1 = list[i], p2 = list[n - 1 - i]
      if (p1.id !== 'bye' && p2.id !== 'bye') {
        matches.push({ id: id++, round: r + 1, p1: p1.id, p2: p2.id, s1: null, s2: null, winner: null })
      }
    }
    list.splice(1, 0, list.pop()!)
  }
  return matches
}

export function calcStandings(players: Player[], matches: Match[]): Standing[] {
  const s: Record<string, Standing> = {}
  players.forEach(p => {
    s[p.id] = { id: p.id, name: p.name, pts: 0, pj: 0, v: 0, d: 0, sw: 0, sl: 0, streak: [] }
  })
  matches.filter(m => m.winner).forEach(m => {
    const a = s[m.p1], b = s[m.p2]
    if (!a || !b) return
    a.pj++; b.pj++
    a.sw += m.s1 ?? 0; a.sl += m.s2 ?? 0
    b.sw += m.s2 ?? 0; b.sl += m.s1 ?? 0
    if (m.winner === m.p1) {
      a.pts += 3; a.v++; b.d++
      a.streak.push('W'); b.streak.push('L')
    } else {
      b.pts += 3; b.v++; a.d++
      b.streak.push('W'); a.streak.push('L')
    }
  })
  return Object.values(s).sort((a, b) => b.pts - a.pts || (b.sw - b.sl) - (a.sw - a.sl))
}

export function useTorneo() {
  const supabase = useSupabaseClient()

  const tournament = ref<Tournament | null>(null)
  const players = ref<Player[]>([])
  const matches = ref<Match[]>([])
  const loading = ref(true)
  const syncing = ref(false)

  let channel: RealtimeChannel | null = null

  // ── Load all data ─────────────────────────────────────────────────────────
  async function loadAll() {
    const [t, p, m] = await Promise.all([
      supabase.from('tournament').select('*').eq('id', 'main').single(),
      supabase.from('players').select('*').order('created_at'),
      supabase.from('matches').select('*').order('id'),
    ])
    if (t.data) tournament.value = t.data
    if (p.data) players.value = p.data
    if (m.data) matches.value = m.data
    loading.value = false
  }

  // ── Realtime subscription ─────────────────────────────────────────────────
  function subscribeRealtime() {
    channel = supabase
      .channel('torneo-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament' }, async () => {
        const { data } = await supabase.from('tournament').select('*').eq('id', 'main').single()
        if (data) tournament.value = data
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, async () => {
        const { data } = await supabase.from('players').select('*').order('created_at')
        if (data) players.value = data
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, async (payload) => {
        // Update solo el partido cambiado para no recargar todo
        if (payload.eventType === 'UPDATE') {
          const idx = matches.value.findIndex(m => m.id === (payload.new as Match).id)
          if (idx !== -1) matches.value[idx] = payload.new as Match
        } else {
          const { data } = await supabase.from('matches').select('*').order('id')
          if (data) matches.value = data
        }
      })
      .subscribe()
  }

  // ── Admin actions ─────────────────────────────────────────────────────────
  async function addPlayer(name: string, nickname?: string): Promise<string | null> {
    const id = Date.now().toString()
    const { error } = await supabase.from('players').insert({ id, name, nickname: nickname || null })
    if (error) return error.message
    return null
  }

  async function removePlayer(id: string) {
    await supabase.from('players').delete().eq('id', id)
  }

  async function launchDraw() {
    syncing.value = true
    // 1. Borrar partidos previos si los hay
    await supabase.from('matches').delete().neq('id', -1)

    // 2. Generar sorteo
    const shuffled = shuffle(players.value)
    const newMatches = generateRoundRobin(shuffled)

    // 3. Insertar partidos
    if (newMatches.length > 0) {
      await supabase.from('matches').insert(newMatches)
    }

    // 4. Cambiar fase
    await supabase.from('tournament').update({ phase: 'sorteo', revealed_rounds: [] }).eq('id', 'main')
    syncing.value = false
  }

  async function revealNextRound() {
    if (!tournament.value) return
    const byRound = new Set(matches.value.map(m => m.round))
    const allRounds = [...byRound].sort((a, b) => a - b)
    const revealed = tournament.value.revealed_rounds ?? []
    const next = allRounds.find(r => !revealed.includes(r))
    if (next === undefined) return
    await supabase.from('tournament').update({ revealed_rounds: [...revealed, next] }).eq('id', 'main')
  }

  async function finishDraw() {
    await supabase.from('tournament').update({ phase: 'torneo' }).eq('id', 'main')
  }

  async function saveMatchResult(match: Match) {
    syncing.value = true
    // s1/s2 se calculan automáticamente a partir de los sets
    const s1 = (match.set1_p1 !== null && match.set2_p1 !== null)
      ? (match.set1_p1 > match.set1_p2! ? 1 : 0) + (match.set2_p1 > match.set2_p2! ? 1 : 0) + (match.tb_p1 !== null && match.tb_p1 > match.tb_p2! ? 1 : 0)
      : null
    const s2 = s1 !== null ? (match.tb_p1 !== null ? 3 - s1 : 2 - s1) : null
    await supabase.from('matches').update({
      s1, s2,
      set1_p1: match.set1_p1, set1_p2: match.set1_p2,
      set2_p1: match.set2_p1, set2_p2: match.set2_p2,
      tb_p1: match.tb_p1 ?? null, tb_p2: match.tb_p2 ?? null,
      winner: match.winner,
      updated_at: new Date().toISOString(),
    }).eq('id', match.id)
    syncing.value = false
  }

  async function resetTorneo() {
    syncing.value = true
    await supabase.from('matches').delete().neq('id', -1)
    await supabase.from('players').delete().neq('id', 'x')
    await supabase.from('tournament').update({ phase: 'registro', revealed_rounds: [] }).eq('id', 'main')
    syncing.value = false
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  const standings = computed(() => calcStandings(players.value, matches.value))

  const byRound = computed(() => {
    const map: Record<number, Match[]> = {}
    matches.value.forEach(m => {
      if (!map[m.round]) map[m.round] = []
      map[m.round].push(m)
    })
    return map
  })

  const totalMatches = computed(() => matches.value.length)
  const doneMatches = computed(() => matches.value.filter(m => m.winner).length)
  const progress = computed(() => totalMatches.value ? Math.round((doneMatches.value / totalMatches.value) * 100) : 0)

  const allRounds = computed(() =>
    [...new Set(matches.value.map(m => m.round))].sort((a, b) => a - b)
  )

  const allRevealed = computed(() => {
    const revealed = tournament.value?.revealed_rounds ?? []
    return allRounds.value.every(r => revealed.includes(r))
  })

  const playerMap = computed(() => {
    const map: Record<string, Player> = {}
    players.value.forEach(p => map[p.id] = p)
    return map
  })

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  onMounted(async () => {
    await loadAll()
    subscribeRealtime()
  })

  onUnmounted(() => {
    channel?.unsubscribe()
  })

  return {
    tournament, players, matches, loading, syncing,
    standings, byRound, totalMatches, doneMatches, progress,
    allRounds, allRevealed, playerMap,
    addPlayer, removePlayer, launchDraw,
    revealNextRound, finishDraw, saveMatchResult, resetTorneo,
  }
}
