import { useState, useEffect, useCallback } from "react";
import { Target, Plus, TrendingUp, Search, AlertTriangle, Loader2, X } from "lucide-react";
import { goalService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

export default function Goals() {
  const { logout } = useAuth();
  const { currentProfile } = useProfile();
  
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  
  // States for new goal form
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  
  // State for add funds form
  const [fundAmount, setFundAmount] = useState("");

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await goalService.list(currentProfile);
      setGoals(res || []);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        console.error("Falha ao carregar metas:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [currentProfile, logout]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    
    try {
      await goalService.create({
        name,
        target_amount: parseFloat(targetAmount.replace(",", ".")),
        deadline: deadline || null,
        profile_type: currentProfile
      });
      setIsModalOpen(false);
      setName("");
      setTargetAmount("");
      setDeadline("");
      loadGoals();
    } catch (error) {
      console.error("Erro ao criar meta", error);
      alert("Erro ao criar meta.");
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    if (!selectedGoal || !fundAmount) return;

    try {
      await goalService.addFunds(selectedGoal.id, parseFloat(fundAmount.replace(",", ".")));
      setIsFundModalOpen(false);
      setSelectedGoal(null);
      setFundAmount("");
      loadGoals();
    } catch (error) {
      console.error("Erro ao adicionar fundos", error);
      alert("Erro ao adicionar fundos.");
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Deseja realmente excluir esta meta?")) return;
    try {
      await goalService.delete(id);
      loadGoals();
    } catch (error) {
      console.error("Erro ao excluir meta", error);
      alert("Erro ao excluir meta.");
    }
  };

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Cabeçalho ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Target className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Metas Financeiras
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Planeje, acompanhe e alcance seus grandes objetivos financeiros.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-bold shadow-lg shadow-brand-500/30 ring-1 ring-brand-500/50 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* ── Listagem de Metas ──────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          <p className="font-medium">Carregando suas metas...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-300 dark:text-slate-600">
            <Target className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Nenhuma meta definida
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6 text-sm">
            Que tal começar planejando sua próxima viagem, a compra de um carro ou montar sua reserva de emergência?
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold shadow-md hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Criar Minha Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100).toFixed(0);
            return (
              <div key={goal.id} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-card border border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-all hover:-translate-y-1 hover:shadow-xl group">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2">
                      {goal.name}
                    </h3>
                    <button 
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                      title="Excluir Meta"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Guardado</p>
                      <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(goal.current_amount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Objetivo</p>
                      <p className="text-sm font-semibold text-slate-500">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${
                        pct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-brand-600 to-brand-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    >
                      {/* Shine effect */}
                      <div className="absolute top-0 left-0 bottom-0 w-1/2 bg-white/20 -skew-x-12 transform -translate-x-full animate-shine" />
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                     <span className="text-xs font-bold text-slate-400">Progresso</span>
                     <span className={`text-xs font-bold ${pct >= 100 ? 'text-emerald-500' : 'text-brand-600 dark:text-brand-400'}`}>
                       {pct}%
                     </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setIsFundModalOpen(true);
                    }}
                    disabled={pct >= 100}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <TrendingUp className="w-4 h-4" />
                    {pct >= 100 ? "Meta Alcançada 🎉" : "Adicionar Dinheiro"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Criar Meta ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Nova Meta Financeira</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome da Meta (ex: Viagem Europa)</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="Nome da Meta"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor do Objetivo (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="Ex: 5000.00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Prazo (Opcional)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Adicionar Fundos ─────────────────────────────────── */}
      {isFundModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 ring-1 ring-slate-200 dark:ring-slate-800 animate-fade-in-up">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Adicionar à Meta</h2>
            <p className="text-sm text-slate-500 mb-4">Você está investindo em <strong>{selectedGoal.name}</strong></p>
            <form onSubmit={handleAddFunds} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Valor a adicionar (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  autoFocus
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Ex: 100.00"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFundModalOpen(false)}
                  className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-lg transition-colors cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
