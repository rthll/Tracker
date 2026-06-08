let _tokenProvider = null

function getBaseUrl() {
  return window.TRACKER_API_BASE_URL || '/api'
}

async function req(path, options = {}) {
  const token = _tokenProvider ? await _tokenProvider() : null
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`)
  return data
}

export function setTokenProvider(fn) {
  _tokenProvider = fn
}

export const api = {
  health: () => req('/health'),
  requestSignupCode: (email) =>
    req('/auth/signup-code', { method: 'POST', body: JSON.stringify({ email }) }),
  completeSignup: (email, password, code) =>
    req('/auth/complete-signup', { method: 'POST', body: JSON.stringify({ email, password, code }) }),
  getTrackerState: () => req('/tracker/state'),
  saveTrackerState: (data) =>
    req('/tracker/state', { method: 'PUT', body: JSON.stringify(data) }),
  applyTrackerChange: (change, fullData) =>
    req('/tracker/change', { method: 'PATCH', body: JSON.stringify({ change, fullData }) }),
  deleteAccount: () => req('/auth/account', { method: 'DELETE' }),

  getChatConversations: () => req('/chat/conversations'),
  createChatConversation: () => req('/chat/conversations', { method: 'POST' }),
  getChatMessages: (id) => req(`/chat/conversations/${id}/messages`),
  sendChatMessage: (id, content) =>
    req(`/chat/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
}
