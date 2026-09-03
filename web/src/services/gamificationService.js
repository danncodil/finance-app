// src/services/gamificationService.js
import { supabase } from "./supabase";

/**
 * Helper temporário para fetch com auth
 */
async function authenticatedFetch(endpoint) {
  const { data: authData } = await supabase.auth.getSession();
  const token = authData.session?.access_token;
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    }
  });
  if (!response.ok) throw new Error("Erro na API");
  return response.json();
}

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
      // Retorna objeto consolidado: { xp_points, current_level, unlocked_achievements: [] }
      return await authenticatedFetch('/api/v1/gamification/status');
    } catch (err) {
      console.warn("Gamificação offline (Rust API não responde):", err.message);
      return { xp_points: 0, current_level: 1, unlocked_achievements: [] };
    }
  }
};
