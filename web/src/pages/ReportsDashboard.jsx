import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function ReportsDashboard() {
  const expenseData = [
    { name: "Moradia", value: 2500, color: "#3b82f6" },
    { name: "Alimentação", value: 1200, color: "#10b981" },
    { name: "Transporte", value: 600, color: "#f59e0b" },
    { name: "Lazer", value: 400, color: "#8b5cf6" },
  ];

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto relative min-h-full space-y-6 animate-fade-in pb-24 sm:pb-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>📊</span> Insights
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Análises inteligentes e relatórios do seu fluxo financeiro
          </p>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Resumo Mensal */}
        <div className="md:col-span-2 bg-slate-900 rounded-3xl p-8 border border-white/10 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <h2 className="text-white/60 text-sm font-semibold uppercase tracking-wider mb-2">Balanço do Mês</h2>
              <div className="text-4xl font-extrabold text-white">R$ 1.340,00</div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-3 py-1.5 rounded-full">
                  <ArrowUpRight className="w-4 h-4" />
                  +12% receitas
                </div>
                <div className="flex items-center gap-2 text-rose-400 text-sm font-medium bg-rose-400/10 px-3 py-1.5 rounded-full">
                  <ArrowDownRight className="w-4 h-4" />
                  -5% despesas
                </div>
              </div>
            </div>
            <div className="mt-8 flex gap-6">
              <div className="flex-1">
                <div className="text-slate-400 text-xs mb-1">Entradas</div>
                <div className="text-white font-bold text-lg">R$ 5.400,00</div>
              </div>
              <div className="flex-1">
                <div className="text-slate-400 text-xs mb-1">Saídas</div>
                <div className="text-white font-bold text-lg">R$ 4.060,00</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-8 border border-purple-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-300 mb-4">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-sm tracking-wide">AI INSIGHTS</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Você gastou <strong>15% a menos</strong> com <em>Alimentação</em> neste mês em comparação ao mês passado. Se mantiver esse ritmo, poderá investir mais na sua meta de "Viagem"!
            </p>
          </div>
          <button className="mt-6 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm font-semibold transition-all">
            Ver detalhes
          </button>
        </div>

        {/* Gráfico de Despesas (Donut) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-card flex flex-col md:flex-row items-center gap-8">
          <div className="w-full md:w-1/2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Composição de Gastos</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Onde seu dinheiro está indo</p>
            <div className="space-y-4">
              {expenseData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
              <span className="text-slate-400 text-xs font-semibold">Total</span>
              <span className="text-slate-900 dark:text-white font-bold text-lg">R$ 4.700</span>
            </div>
          </div>
        </div>

        {/* Alerta de Orçamento */}
        <div className="bg-white dark:bg-slate-900/50 rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-card">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Alerta de Orçamento</h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Lazer</span>
                <span className="text-rose-500 font-bold">90%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full w-[90%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Transporte</span>
                <span className="text-amber-500 font-bold">75%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[75%]" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-700 dark:text-slate-300 font-medium">Mercado</span>
                <span className="text-emerald-500 font-bold">40%</span>
              </div>
              <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[40%]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
