// src/pages/Dashboard.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import { Wallet, TrendingUp, TrendingDown, Plus } from "lucide-react";
import SummaryCard from "../components/SummaryCard";
import RecentTransactions from "../components/RecentTransactions";
import QuickActions from "../components/QuickActions";
import TransactionModal from "../components/TransactionModal";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";
import { transactionService, categoryService, reportService, goalService, gamificationService } from "../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const { logout } = useAuth();
  const { currentProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [monthlyFlow, setMonthlyFlow] = useState([]);
  const [goals, setGoals] = useState([]); // GAMIFICAÇÃO: Estado para as metas
  const [unlockedBadges, setUnlockedBadges] = useState([]);
  const [userLevel, setUserLevel] = useState(1);
  const [userXp, setUserXp] = useState(0);
  const [toastXP, setToastXP] = useState(null);
  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expense: 0,
    balanceTrend: 0,
    incomeTrend: 0,
    expenseTrend: 0,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const date = new Date();
      const [catsRes, txRes, repRes, goalsRes, statusRes] = await Promise.all([
        categoryService.list(currentProfile),
        transactionService.list(currentProfile),
        reportService.getSummary(date.getMonth() + 1, date.getFullYear()),
        goalService.list(), // goalService agora pega tudo do backend direto
        gamificationService.getStatus()
      ]);

      setCategories(catsRes || []);
      setGoals(goalsRes || []);
      
      const currentXp = statusRes?.xp_points || 0;
      
      // Checa ganho de XP após recarregar dados (ex: depois de adicionar transação)
      setUserXp(prevXp => {
        if (prevXp > 0 && currentXp > prevXp) {
          const xpGained = currentXp - prevXp;
          setToastXP(prev => {
            if (prev?.type === 'special') return prev;
            setTimeout(() => setToastXP(pt => pt?.type === 'special' ? pt : null), 4000);
            return { xp: xpGained, message: "XP Ganho!" };
          });
        }
        return currentXp;
      });
      setUserLevel(statusRes?.current_level || 1);
      
      // Mapeia os selos vindos do banco para seus slugs locais (ex: 'first_transaction')
      const backendBadges = statusRes?.unlocked_achievements?.map(a => a.icon_slug) || [];
      setUnlockedBadges(backendBadges);
      
      if (repRes) {
        setMonthlyFlow(repRes.monthly_flow || []);
      }
      
      if (txRes) {
        setTransactions(txRes.transactions || []);
        setSummary((prev) => ({
          ...prev,
          balance: parseFloat(txRes.summary?.balance) || 0,
          income: parseFloat(txRes.summary?.total_income) || 0,
          expense: parseFloat(txRes.summary?.total_expense) || 0,
        }));
      }
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        console.error("Falha ao carregar dados do dashboard:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [logout, currentProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoryExpenses = useMemo(() => {
    if (!transactions.length || !categories.length) return [];
    
    const expensesByCategory = {};
    let totalExpense = 0;
    
    transactions.forEach(tx => {
      if (tx.type === "expense") {
        const amount = Number(tx.amount) || 0;
        expensesByCategory[tx.category_id] = (expensesByCategory[tx.category_id] || 0) + amount;
        totalExpense += amount;
      }
    });
    
    if (totalExpense === 0) return [];
    
    const colors = [
      "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
      "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
      "bg-gradient-to-r from-blue-500 to-cyan-400",
      "bg-slate-500"
    ];
    
    return Object.entries(expensesByCategory)
      .map(([catId, amount]) => {
        const catName = categories.find(c => c.id === catId)?.name || "Outros";
        return {
          name: catName,
          amount,
          pct: Math.round((amount / totalExpense) * 100)
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4)
      .map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }));
  }, [transactions, categories]);

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto relative min-h-full space-y-6 animate-fade-in pb-24 sm:pb-6">
      {/* ── Header da página ──────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Visão geral das suas finanças em{" "}
            <span className="font-semibold text-brand-600 dark:text-brand-400 capitalize">
              {new Date().toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="
            hidden sm:flex items-center justify-center gap-2 px-6 py-3 rounded-xl
            bg-blue-600 hover:bg-blue-500 active:scale-[0.98]
            text-white text-sm font-bold shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50
            transition-all duration-200 cursor-pointer w-auto
          "
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 dark:text-slate-500 space-y-3">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando seus dados financeiros...</p>
        </div>
      ) : (
        <>
          {/* ── Bento Grid: Cards de Resumo ────────────────────────────── */}
          <section
            id="summary-cards"
            className="flex overflow-x-auto sm:grid sm:grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pb-2 sm:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="min-w-[85vw] sm:min-w-0 lg:col-span-2 h-full snap-center">
              <SummaryCard
                title="Saldo Geral"
                value={summary.balance}
                variant="balance"
                icon={Wallet}
                trend={summary.balanceTrend}
                delay={0}
                isGiant={true}
              />
            </div>
            <div className="min-w-[85vw] sm:min-w-0 flex flex-col gap-5 sm:gap-6 h-full snap-center">
              <SummaryCard
                title="Total de Receitas"
                value={summary.income}
                variant="income"
                icon={TrendingUp}
                trend={summary.incomeTrend}
                delay={100}
              />
              <SummaryCard
                title="Total de Despesas"
                value={summary.expense}
                variant="expense"
                icon={TrendingDown}
                trend={summary.expenseTrend}
                delay={200}
              />
            </div>
          </section>

          {/* ── Gráfico de Fluxo de Caixa (Recharts) ─────────────────── */}
          {monthlyFlow.length > 0 && (
            <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-card border border-slate-100 dark:border-white/5 transition-colors duration-200 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500" />
                    Fluxo Financeiro
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Receitas e Despesas dos últimos 6 meses
                  </p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyFlow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(val) => {
                        const [y, m] = val.split('-');
                        const d = new Date(y, m - 1);
                        return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
                      }} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(val) => `R$ ${val / 1000}k`}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                      labelFormatter={(val) => {
                        const [y, m] = val.split('-');
                        const d = new Date(y, m - 1);
                        return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
                      }}
                    />
                    <Area type="monotone" dataKey="income" name="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" name="Despesa" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* ── Ações rápidas ─────────────────────────────────────────── */}
          <section>
            <QuickActions />
          </section>

          {/* ── Gamificação: Metas e Conquistas ───────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            
            {/* Metas em Destaque (Barras Luminosas) */}
            <section className="bg-white dark:bg-slate-900/40 rounded-3xl dark:backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-card p-6 sm:p-7 transition-colors duration-200 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🎯</span> Progresso das Metas
                </h2>
              </div>
              
              <div className="space-y-5 flex-1">
                {goals.length > 0 ? (
                  goals.slice(0, 3).map((goal) => {
                    const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
                    const isCompleted = progress >= 100;
                    
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {isCompleted && <span className="text-yellow-500 text-xs">⭐</span>}
                            {goal.name}
                          </span>
                          <span className="font-medium text-slate-500 dark:text-slate-400">
                            {Math.round(progress)}%
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden relative">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
                              isCompleted 
                                ? "bg-gradient-to-r from-yellow-500 to-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.5)] shadow-yellow-500/50 animate-pulse" 
                                : "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 py-6">
                    <p className="text-sm">Nenhuma meta cadastrada.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Conquistas (Selo Gamificação) */}
            <section className="bg-white dark:bg-slate-900/40 rounded-3xl dark:backdrop-blur-xl border border-slate-100 dark:border-white/5 shadow-card p-6 sm:p-7 transition-colors duration-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>🏆</span> Minhas Conquistas
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-medium">{userXp} XP</span>
                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-500/30 px-2 py-1 rounded-md">
                    Nível {userLevel}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.values(gamificationService.ACHIEVEMENTS).map(achieve => {
                  const isUnlocked = unlockedBadges.includes(achieve.id);
                  
                  if (isUnlocked) {
                    return (
                      <div key={achieve.id} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer group">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-500/20 text-2xl mb-2 group-hover:scale-110 transition-transform text-yellow-400">
                          {achieve.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-white text-center">{achieve.name}</span>
                        <span className="text-[10px] text-yellow-600 dark:text-yellow-400 text-center mt-1 font-medium">{achieve.description}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div key={achieve.id} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800 border border-slate-700 grayscale opacity-40 transition-all">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 text-2xl mb-2 relative">
                          {achieve.icon}
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
                            <span className="text-[10px] text-white">🔒</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 text-center">{achieve.name}</span>
                        <span className="text-[10px] text-slate-400 text-center mt-1">{achieve.description}</span>
                      </div>
                    );
                  }
                })}
              </div>
            </section>
          </div>

          {/* ── Conteúdo principal ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transações recentes — ocupa 2 colunas no desktop */}
            <div className="lg:col-span-2">
              <RecentTransactions transactions={transactions} categories={categories} />
            </div>

            {/* Painel lateral — resumo por categoria */}
            <aside
              className="
                bg-white dark:bg-slate-900/40 rounded-3xl dark:backdrop-blur-xl
                border border-slate-100 dark:border-white/5
                shadow-card p-7 transition-colors duration-200
              "
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Despesas por Categoria
              </h2>
              <ul className="space-y-3.5">
                {categoryExpenses.length > 0 ? (
                  categoryExpenses.map((cat) => (
                    <li key={cat.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {cat.name}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {cat.pct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${cat.color} transition-all duration-700 ease-out`}
                          style={{ width: `${cat.pct}%` }}
                        />
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    Nenhuma despesa para analisar neste período.
                  </li>
                )}
              </ul>

              {/* Alerta amarelo informativo */}
              <div
                className="
                  mt-6 flex items-start gap-2.5 p-3.5 rounded-xl
                  bg-accent-50 dark:bg-accent-950/60 ring-1 ring-accent-200 dark:ring-accent-800/60
                "
              >
                <span className="text-accent-600 dark:text-accent-400 text-lg leading-none mt-0.5">
                  ⚠️
                </span>
                <p className="text-xs text-accent-800 dark:text-accent-300 font-medium leading-relaxed">
                  Suas despesas representam grande parte do seu orçamento. Mantenha os lançamentos atualizados para melhor controle.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}

      {/* Mobile FAB: Novo Lançamento */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="sm:hidden fixed bottom-[84px] right-4 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label="Novo Lançamento"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Toast Dinâmico de XP */}
      {toastXP && (
        <div className="fixed top-6 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-6 z-50 animate-fade-in-up">
          {toastXP.type === 'special' ? (
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900 border border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)] text-white">
              <span className="text-2xl animate-bounce text-yellow-400">✨</span>
              <div>
                <p className="text-sm font-extrabold text-yellow-400">{toastXP.title}</p>
                <p className="text-xs font-medium text-slate-300">+{toastXP.xp} XP {toastXP.subtitle}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 shadow-[0_10px_20px_rgba(245,158,11,0.4)] text-white">
              <span className="text-2xl animate-bounce">🏆</span>
              <div>
                <p className="text-sm font-extrabold">+{toastXP.xp} XP</p>
                <p className="text-xs font-medium text-yellow-50">{toastXP.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de Novo Lançamento ───────────────────────────────── */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(res) => {
          if (res?.unlocked_achievements && res.unlocked_achievements.length > 0) {
            const ach = res.unlocked_achievements[0];
            setToastXP({
              type: 'special',
              xp: ach.xp_reward,
              title: `${ach.name} Desbloqueada! ✨`,
              subtitle: ach.description
            });
            setTimeout(() => setToastXP(null), 5000);
          }
          loadData();
        }}
      />
    </div>
  );
}
