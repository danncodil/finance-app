import { supabase } from "./supabase";

/**
 * Helper interno para requisições na API Rust local
 */
async function authenticatedFetch(endpoint, options = {}) {
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const baseUrl = import.meta.env.VITE_API_URL || "";
  const url = `${baseUrl.replace(/\/$/, "")}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro na API: ${response.status}`);
  }

  return response.json();
}

/**
 * Serviços de Autenticação
 */
export const authService = {
  async register({ name, email, password }) {
    // 1. Cria usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    return { user: data.user, access_token: data.session?.access_token };
  },

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, access_token: data.session?.access_token };
  },

  async loginWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};

/**
 * Serviços de Categorias
 */
export const categoryService = {
  async list(profileType = null) {
    let query = supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });
      
    if (profileType) {
      query = query.eq("profile_type", profileType);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(payload) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("categories")
      .insert([{ 
        ...payload, 
        user_id: userData.user.id,
        profile_type: payload.profile_type || 'personal'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id, payload) {
    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

/**
 * Serviços de Lançamentos (Transações)
 */
export const transactionService = {
  async list(profileType = null) {
    let query = supabase
      .from("transactions")
      .select("*, category:categories(*)")
      .order("date", { ascending: false });

    if (profileType) {
      query = query.eq("profile_type", profileType);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Calcular resumo
    let totalIncome = 0;
    let totalExpense = 0;
    data.forEach((tx) => {
      const amount = Number(tx.amount);
      if (tx.type === "income") totalIncome += amount;
      if (tx.type === "expense") totalExpense += amount;
    });

    return {
      transactions: data,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
    };
  },
  async create(payload) {
    return await authenticatedFetch('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async update(id, payload) {
    const { data, error } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) throw error;
  },
};

/**
 * Serviços de Projetos
 */
export const projectService = {
  async list(status = null) {
    let query = supabase.from("projects").select("*").order("name", { ascending: true });
    if (status) query = query.eq("status", status);
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },
  async create(payload) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("projects")
      .insert([{ ...payload, user_id: userData.user.id }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

/**
 * Serviços de Metas Financeiras (Goals) - RUST API
 */
export const goalService = {
  async list() {
    return await authenticatedFetch('/api/v1/goals');
  },
  async create(payload) {
    // payload deve ter title e target_amount
    return await authenticatedFetch('/api/v1/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  async addFunds(id, amount) {
    // 1. Pega a meta atual
    const goals = await this.list();
    const currentGoal = goals.find(g => g.id === id);
    if (!currentGoal) throw new Error("Meta não encontrada");

    const newAmount = Number(currentGoal.current_amount) + Number(amount);
    const isCompleted = newAmount >= Number(currentGoal.target_amount);

    return await authenticatedFetch(`/api/v1/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        current_amount: newAmount,
        is_completed: isCompleted 
      })
    });
  },
  async delete(id) {
    await authenticatedFetch(`/api/v1/goals/${id}`, {
      method: 'DELETE'
    });
  },
};

/**
 * Serviços de Relatórios
 */
export const reportService = {
  async getSummary(month, year) {
    return { balance: 0, income: 0, expense: 0 };
  },
};

/**
 * Serviços de Usuário / Configurações
 */
export const userService = {
  async getProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single();
    if (error) throw error;
    return data;
  },
  async updateProfile(payload) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userData.user.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async uploadAvatar(file) {
    const { data: userData } = await supabase.auth.getUser();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userData.user.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  }
};

/**
 * Serviços do Assistente de IA
 */
export const assistantService = {
  async parse(text) {
    // Chama a Serverless Function que nós criamos na Vercel
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      let errorMsg = 'Falha ao processar com a IA.';
      try {
        const errorData = await response.json();
        if (errorData.error) errorMsg = errorData.error;
      } catch (e) {
        // Ignora se não for JSON
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  }
};

export { gamificationService } from "./gamificationService";
