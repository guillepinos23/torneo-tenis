<template>
  <Teleport to="body">
    <div class="overlay">
      <div class="gate" :class="{ shake }">
        <div class="icon">🔐</div>
        <h3>ACCESO ADMIN</h3>
        <input
          v-model="password"
          type="password"
          placeholder="Contraseña..."
          :class="{ error }"
          @keydown.enter="check"
        />
        <button @click="check">ENTRAR</button>
        <p v-if="error" class="err-msg">Contraseña incorrecta</p>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const emit = defineEmits<{ (e: 'unlocked'): void; (e: 'close'): void }>()
const { tryUnlock } = useAdmin()

const password = ref('')
const error = ref(false)
const shake = ref(false)

function check() {
  if (tryUnlock(password.value)) {
    emit('unlocked')
  } else {
    error.value = true
    shake.value = true
    setTimeout(() => { shake.value = false }, 500)
    setTimeout(() => { error.value = false }, 2000)
  }
}
</script>

<style scoped>
.overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.92);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
}
.gate {
  background: #111;
  border: 1px solid #2a2a2a;
  border-radius: 20px;
  padding: 32px 28px;
  width: 100%; max-width: 340px;
  text-align: center;
  animation: scaleIn 0.2s ease;
}
.gate.shake { animation: shake 0.4s ease; }

.icon { font-size: 2rem; margin-bottom: 12px; }

h3 {
  font-family: 'Bebas Neue', display;
  font-size: 1.8rem;
  color: #E8FF4A;
  letter-spacing: 0.05em;
  margin-bottom: 20px;
}

input {
  width: 100%;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 12px 14px;
  color: #fff;
  font-family: 'Space Mono', monospace;
  font-size: 0.9rem;
  outline: none;
  margin-bottom: 12px;
}
input.error { border-color: #ff4c4c; }

button {
  width: 100%;
  background: #E8FF4A;
  color: #0a0a0a;
  border: none;
  border-radius: 10px;
  padding: 12px;
  font-family: 'Bebas Neue', display;
  font-size: 1.2rem;
  letter-spacing: 0.05em;
  cursor: pointer;
  font-weight: 800;
}
button:hover { background: #d4eb30; }

.err-msg {
  color: #ff4c4c;
  font-family: 'Space Mono', monospace;
  font-size: 0.72rem;
  margin-top: 10px;
}
</style>
