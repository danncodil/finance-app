export function resolveApiBase(value = '') {
  const base = value.trim().replace(/\/+$/, '');
  if (!base) return '/api/v1';
  if (base.endsWith('/api')) return `${base}/v1`;
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
}

const API_BASE = resolveApiBase(import.meta.env?.VITE_API_URL);
let refreshPromise = null;

async function readError(response, fallback) {
  const text = await response.text();
  let payload;
  try { payload = JSON.parse(text); } catch { payload = { message: text || fallback }; }
  return buildApiError(response, payload, fallback);
}

/**
 * Converte respostas de erro da API em Error preservando status e código.
 */
function buildApiError(response, payload = {}, fallbackMessage = null) {
  const detail = payload?.error;
  const message =
    (detail && typeof detail === 'object' && detail.message) ||
    (typeof detail === 'string' && detail) ||
    payload?.message ||
    fallbackMessage ||
    `Erro na API: ${response.status}`;

  const error = new Error(message);
  error.status = response.status;
  error.code =
    (detail && typeof detail === 'object' && detail.code) ||
    payload?.code ||
    null;
  return error;
}

/**
 * Cliente HTTP base com interceptor para renovação de token (Refresh Token)
 */
async function authenticatedFetch(endpoint, options = {}) {
  let token = localStorage.getItem('access_token');
  const baseUrl = API_BASE;
  const url = `${baseUrl.replace(/\/$/, "")}${endpoint}`;

  let headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    // All requests share the same refresh rotation.
    const latest = localStorage.getItem('access_token');
    if (latest && latest !== token) {
      headers.Authorization = `Bearer ${latest}`;
      response = await fetch(url, { ...options, headers });
    } else if (localStorage.getItem('refresh_token')) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          const refreshToken = localStorage.getItem('refresh_token');
          const res = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.dispatchEvent(new Event('auth-expired'));
            }
            throw await readError(res);
          }
          const data = await res.json();
          if (localStorage.getItem('refresh_token') !== refreshToken) {
            throw buildApiError({ status: 401 }, { message: 'Sessão encerrada.' });
          }
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          window.dispatchEvent(new Event('auth-refreshed'));
          return data.access_token;
        })().finally(() => { refreshPromise = null; });
      }
      headers.Authorization = `Bearer ${await refreshPromise}`;
      response = await fetch(url, { ...options, headers });
    }
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.dispatchEvent(new Event('auth-expired'));
    }
  }
  if (!response.ok) throw await readError(response);
  // Algumas rotas retornam 204 No Content (sem JSON)
  if (response.status === 204) return null;

  return response.json();
}

/**
 * Serviços de Autenticação
 */
export const authService = {
  async register({ name, email, password }) {
    const baseUrl = API_BASE;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!res.ok) {
      const err = await readError(res);
      throw err;
    }
    return res.json();
  },

  async login({ email, password }) {
    const baseUrl = API_BASE;
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      const err = await readError(res);
      throw err;
    }
    return res.json();
  },

  async logout() {
    const refreshToken = localStorage.getItem('refresh_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.dispatchEvent(new Event('auth-expired'));
    if (refreshToken) {
      try {
        const baseUrl = API_BASE;
        await fetch(`${baseUrl}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      } catch (e) {
        console.error("Erro no logout", e);
      }
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

/**
 * Serviços de Categorias
 */
export const categoryService = {
  async list(profileType = null) {
    let url = '/categories';
    if (profileType) {
      url += `?profile_type=${profileType}`;
    }
    return await authenticatedFetch(url);
  },
  async create(payload) {
    return await authenticatedFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload, profileType = null) {
    const query = profileType ? `?profile_type=${encodeURIComponent(profileType)}` : '';
    return await authenticatedFetch(`/categories/${id}${query}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async delete(id, profileType = null) {
    const query = profileType ? `?profile_type=${encodeURIComponent(profileType)}` : '';
    await authenticatedFetch(`/categories/${id}${query}`, {
      method: 'DELETE'
    });
  },
};

/**
 * Serviços de Lançamentos (Transações)
 */
export const transactionService = {
  async list(profileType = null) {
    let url = '/transactions';
    if (profileType) {
      url += `?profile=${encodeURIComponent(profileType)}`;
    }
    return await authenticatedFetch(url); // O backend já devolve o resumo e transactions
  },
  async create(payload) {
    return await authenticatedFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return await authenticatedFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async delete(id) {
    await authenticatedFetch(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },
};

/**
 * Serviços de Projetos
 */
export const projectService = {
  async list(status = null) {
    let url = '/projects';
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return await authenticatedFetch(url);
  },
  async getById(id) {
    return await authenticatedFetch(`/projects/${id}`);
  },
  async create(payload) {
    return await authenticatedFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    return await authenticatedFetch(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async delete(id) {
    return await authenticatedFetch(`/projects/${id}`, {
      method: 'DELETE'
    });
  },
};

/**
 * Serviços de Metas Financeiras (Goals)
 */
export const goalService = {
  async list(profileType = null) {
    const query = profileType ? `?profile_type=${encodeURIComponent(profileType)}` : '';
    return await authenticatedFetch(`/goals${query}`);
  },
  async create(payload) {
    return await authenticatedFetch('/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload, profileType = null) {
    const query = profileType ? `?profile_type=${encodeURIComponent(profileType)}` : '';
    return authenticatedFetch(`/goals/${id}${query}`, {
      method: 'PUT', body: JSON.stringify(payload)
    });
  },
  async addFunds(id, amount, profileType = null) {
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      throw new Error('O aporte deve ser maior que zero.');
    }
    return goalService.update(id, { amount_to_add: String(amount) }, profileType);
  },  async delete(id, profileType = null) {
    const query = profileType ? `?profile_type=${encodeURIComponent(profileType)}` : '';
    await authenticatedFetch(`/goals/${id}${query}`, {
      method: 'DELETE'
    });
  },
};

/**
 * Serviços de Relatórios
 */
export const reportService = {
  async getSummary(month, year, profileType = null) {
    const profileQuery = profileType ? `&profile_type=${encodeURIComponent(profileType)}` : '';
    return await authenticatedFetch(`/reports/summary?month=${month}&year=${year}${profileQuery}`);
  },
};

/**
 * Serviços de Usuário / Configurações
 */
export const userService = {
  async getProfile() {
    return await authenticatedFetch('/users/profile');
  },
  async updateProfile(payload) {
    return await authenticatedFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  async updatePassword(currentPasswordOrPayload, newPassword = null) {
    const payload =
      currentPasswordOrPayload && typeof currentPasswordOrPayload === 'object'
        ? currentPasswordOrPayload
        : { current_password: currentPasswordOrPayload, new_password: newPassword };

    return await authenticatedFetch('/users/password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: payload.current_password,
        new_password: payload.new_password,
      })
    });
  },
  async getExportData() {
    return await authenticatedFetch('/users/export/data');
  },
  // Alias mantido para compatibilidade com a tela de Configurações.
  async exportData() {
    return await this.getExportData();
  }
};

/**
 * Serviços do Assistente de IA
 */
export const assistantService = {
  async parse(text) {
    return await authenticatedFetch('/assistant/parse', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }
};

/**
 * Gamificação
 */
export const gamificationService = {
  ACHIEVEMENTS: {
    first_transaction: {
      id: "first_transaction",
      name: "Iniciante",
      description: "Primeiro Lançamento",
      icon: "🌟",
      theme: "yellow"
    },
    first_goal: {
      id: "first_goal",
      name: "Focado",
      description: "Primeira Meta",
      icon: "🎯",
      theme: "blue"
    },
    seven_days: {
      id: "seven_days",
      name: "7 Dias",
      description: "Acesso Semanal",
      icon: "🔥",
      theme: "orange"
    },
    budget_shield: {
      id: "budget_shield",
      name: "Blindado",
      description: "Gasto < 50%",
      icon: "🛡️",
      theme: "emerald"
    }
  },

  async getStatus() {
    try {
      return await authenticatedFetch('/gamification/status');
    } catch (err) {
      console.warn("Gamificação indisponível:", err.message);
      return { xp_points: 0, current_level: 1, unlocked_achievements: [] };
    }
  }
};
