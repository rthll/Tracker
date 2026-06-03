const Api = {
  tokenProvider: null,

  setTokenProvider(provider) {
    this.tokenProvider = provider;
  },

  getBaseUrl() {
    return window.TRACKER_API_BASE_URL || "http://127.0.0.1:3333/api";
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
  }
};

window.Api = Api;
