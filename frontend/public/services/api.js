const Api = {
  tokenProvider: null,

  setTokenProvider(provider) {
    this.tokenProvider = provider;
  },

  getBaseUrl() {
    return window.TRACKER_API_BASE_URL || "/api";
  },

  async request(path, options = {}) {
    const token = this.tokenProvider ? await this.tokenProvider() : null;
    const response = await fetch(`${this.getBaseUrl()}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || "Erro ao comunicar com a API.");
    }

    return data;
  },

  health() {
    return this.request("/health");
  },

  requestSignupCode(email) {
    return this.request("/auth/signup-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
  },

  completeSignup(email, password, code) {
    return this.request("/auth/complete-signup", {
      method: "POST",
      body: JSON.stringify({ email, password, code })
    });
  },

  getTrackerState() {
    return this.request("/tracker/state");
  },

  saveTrackerState(data) {
    return this.request("/tracker/state", {
      method: "PUT",
      body: JSON.stringify(data)
    });
  },

  applyTrackerChange(change, fullData) {
    return this.request("/tracker/change", {
      method: "PATCH",
      body: JSON.stringify({ change, fullData })
    });
  },

  deleteAccount() {
    return this.request("/auth/account", {
      method: "DELETE"
    });
  }
};

window.Api = Api;
