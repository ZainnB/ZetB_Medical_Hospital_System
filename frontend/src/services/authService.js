const SESSION_KEY = 'hospitalSession'

export const authService = {
  getSession: () => {
    try {
      const stored = window.localStorage.getItem(SESSION_KEY)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      return parsed.token ? parsed : null
    } catch {
      return null
    }
  },

  saveSession: (session) => {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  clearSession: () => {
    window.localStorage.removeItem(SESSION_KEY)
  },

  EMPTY_SESSION: { token: null, role: null, user_id: null, username: null },
}

