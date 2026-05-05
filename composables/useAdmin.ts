// composables/useAdmin.ts
export function useAdmin() {
  const isAdmin = useState('isAdmin', () => false)
  const config = useRuntimeConfig()

  function tryUnlock(password: string): boolean {
    if (password === config.public.adminPassword) {
      isAdmin.value = true
      return true
    }
    return false
  }

  function lock() {
    isAdmin.value = false
  }

  return { isAdmin: readonly(isAdmin), tryUnlock, lock }
}
