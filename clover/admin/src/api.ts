const API_BASE = "http://localhost:4000/api";

let apiKey = localStorage.getItem("clover_admin_key") || "";

export function setApiKey(key: string) {
  apiKey = key;
  localStorage.setItem("clover_admin_key", key);
}

export function getApiKey() {
  return apiKey;
}

async function adminFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      ...(options.headers as Record<string, string> || {}),
    },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json;
}

export const api = {
  // Dashboard
  async getDashboard() {
    return (await adminFetch("/admin/dashboard")).data;
  },

  // Users
  async getUsers(page = 1, limit = 50, search = "") {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set("search", search);
    return await adminFetch(`/admin/users?${params}`);
  },
  async getUser(id: string) {
    return (await adminFetch(`/admin/users/${id}`)).data;
  },

  // Sessions
  async getSessions(page = 1, limit = 50, filters: Record<string, string> = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), ...filters });
    return await adminFetch(`/admin/sessions?${params}`);
  },
  async exportSessions() {
    return (await adminFetch("/admin/sessions/export")).data;
  },
  async markSold(sessionIds: string[], totalSalePrice: number, buyerId?: string) {
    return (await adminFetch("/admin/sessions/mark-sold", {
      method: "POST",
      body: JSON.stringify({ sessionIds, totalSalePrice, buyerId }),
    })).data;
  },

  // Packages
  async getPackages() {
    return (await adminFetch("/admin/packages")).data;
  },
  async createPackage(sessionIds: string[], name: string, category: string) {
    return (await adminFetch("/admin/packages/create", {
      method: "POST",
      body: JSON.stringify({ sessionIds, name, category }),
    })).data;
  },
  async sellPackage(id: string, salePrice: number, buyerId?: string) {
    return (await adminFetch(`/admin/packages/${id}/sell`, {
      method: "POST",
      body: JSON.stringify({ salePrice, buyerId }),
    })).data;
  },

  // Payouts
  async getPayouts(page = 1, limit = 50, status?: string) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set("status", status);
    return await adminFetch(`/admin/payouts?${params}`);
  },
  async processPayout(id: string) {
    return (await adminFetch(`/admin/payouts/${id}/process`, { method: "POST" })).data;
  },
  async rejectPayout(id: string) {
    return (await adminFetch(`/admin/payouts/${id}/reject`, { method: "POST" })).data;
  },

  // Config
  async getConfig() {
    return (await adminFetch("/admin/config")).data;
  },
  async updateConfig(updates: Record<string, number>) {
    return (await adminFetch("/admin/config", {
      method: "PUT",
      body: JSON.stringify(updates),
    })).data;
  },
};
