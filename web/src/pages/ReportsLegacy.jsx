// web/src/pages/Reports.jsx
import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  Loader2,
  X,
  PieChart,
  Activity,
  Download,
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { reportService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

const MONTHS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

const YEARS = [2026, 2025, 2024];

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function parseDateFlow(monthStr) {
  const [year, month] = monthStr.split("-");
  const date = new Date(year, parseInt(month, 10) - 1);
  return date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

export default function Reports() {
  const { logout } = useAuth();
  const { currentProfile } = useProfile();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);

  const handleExportPDF = () => {
    setIsExporting(true);
    const element = document.getElementById("report-content");
    const opt = {
      margin:       10,
      filename:     `Relatorio-Trio-${month}-${year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Pequeno delay para garantir que a UI se ajuste (remoção de classes dark) antes de renderizar
    setTimeout(() => {
      html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
      });
    }, 300);
  };

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setErrorAlert(null);
      const res = await reportService.getSummary(month, year, currentProfile);
      setData(res);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao carregar dados do relatório.");
      }
    } finally {
      setLoading(false);
    }
  }, [month, year, logout, currentProfile]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Cabeçalho e Filtros ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Relatórios e Estatísticas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analise seu comportamento financeiro e histórico de gastos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de Período */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-1.5" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="dark:bg-slate-900">
                  {m.label}
                </option>
              ))}
            </select>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 pr-2 focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="dark:bg-slate-900">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={loading || !data || isExporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* ── Alerta Amarelo ────────────────────────────────────────────── */}
      {errorAlert && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/60 border border-accent-300 dark:border-accent-800 text-accent-900 dark:text-accent-300 shadow-sm animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-semibold text-accent-800 dark:text-accent-300">Atenção</p>
            <p className="text-accent-700 dark:text-accent-400 mt-0.5">{errorAlert}</p>
          </div>
          <button
            onClick={() => setErrorAlert(null)}
            className="text-accent-600 hover:text-accent-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
          <p className="font-medium">Calculando inteligência financeira...</p>
        </div>
      ) : data ? (
        <div id="report-content" className={`space-y-6 animate-fade-in-up ${isExporting ? 'bg-white p-6 rounded-2xl' : ''}`}>
          {isExporting && (
             <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <img src="/simbolo-trio.png" className="w-12 h-12 mx-auto mb-3" alt="Logo" />
                <h1 className="text-2xl font-bold text-slate-900">Relatório Financeiro</h1>
                <p className="text-slate-500 font-medium">{MONTHS.find(m => m.value === month)?.label} de {year}</p>
             </div>
          )}
          {/* ── Cards de Balanço do Período (Empilhados no mobile) ─────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Receitas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-colors duration-200">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total de Receitas
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(data.total_income)}
                </h3>
              </div>
            </div>

            {/* Despesas */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-colors duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center shrink-0">
                <TrendingDown className="w-6 h-6 text-rose-500 dark:text-rose-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total de Despesas
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {formatCurrency(data.total_expense)}
                </h3>
              </div>
            </div>

            {/* Balanço Líquido */}
            <div className="bg-gradient-to-br from-brand-900 to-brand-950 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 shadow-card border border-brand-800 dark:border-slate-800 text-white flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-accent-300" />
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-300 dark:text-slate-400 uppercase tracking-wider">
                  Balanço Líquido
                </p>
                <h3 className="text-2xl font-bold mt-1">
                  {formatCurrency(data.balance)}
                </h3>
              </div>
            </div>
          </div>

          {/* ── Distribuição de Despesas por Categoria e Evolução ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Distribuição por Categoria (Barras de Progresso) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-6 space-y-6 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Distribuição por Categoria
                </h2>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {data.expenses_by_category?.length || 0} categorias
                </span>
              </div>

              {data.expenses_by_category?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-sm">Nenhuma despesa registrada para este período.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.expenses_by_category?.map((cat) => (
                    <div key={cat.category_name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color || "#3B82F6" }}
                          />
                          <span>{cat.category_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatCurrency(cat.amount)}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 w-10 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso com a cor da categoria */}
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{
                            width: `${Math.min(cat.percentage, 100)}%`,
                            backgroundColor: cat.color || "#3B82F6",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparativo de Evolução Mensal (Últimos 6 meses) */}
            <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-6 space-y-6 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  Evolução Mensal (Últimos 6 meses)
                </h2>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Receitas
                  </span>
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
                  </span>
                </div>
              </div>

              {data.monthly_flow?.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-sm">Sem histórico suficiente para exibir o fluxo.</p>
                </div>
              ) : (
                <div className="pt-6 pb-2">
                  <div className="grid grid-cols-6 gap-2 sm:gap-4 h-48 items-end border-b border-slate-100 dark:border-slate-800 pb-4">
                    {data.monthly_flow?.map((flow) => {
                      const maxVal = Math.max(
                        ...data.monthly_flow.map((f) =>
                          Math.max(Number(f.income) || 0, Number(f.expense) || 0)
                        ),
                        1
                      );

                      const incomeHeight = ((Number(flow.income) || 0) / maxVal) * 100;
                      const expenseHeight = ((Number(flow.expense) || 0) / maxVal) * 100;

                      return (
                        <div key={flow.month} className="flex flex-col items-center gap-2 group relative">
                          {/* Tooltip flutuante no hover */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-800 text-white text-[10px] p-1.5 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-10">
                            <div>Rec: {formatCurrency(flow.income)}</div>
                            <div>Desp: {formatCurrency(flow.expense)}</div>
                          </div>

                          {/* Barras Lado a Lado */}
                          <div className="w-full flex items-end justify-center gap-1 h-36">
                            <div
                              style={{ height: `${Math.max(incomeHeight, 4)}%` }}
                              className="w-3 sm:w-4 bg-emerald-500 rounded-t-md transition-all duration-500"
                              title={`Receita: ${formatCurrency(flow.income)}`}
                            />
                            <div
                              style={{ height: `${Math.max(expenseHeight, 4)}%` }}
                              className="w-3 sm:w-4 bg-rose-500 rounded-t-md transition-all duration-500"
                              title={`Despesa: ${formatCurrency(flow.expense)}`}
                            />
                          </div>

                          {/* Label do Mês */}
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 capitalize">
                            {parseDateFlow(flow.month)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
