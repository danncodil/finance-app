// web/src/pages/Transactions.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ArrowLeftRight,
  Plus,
  Search,
  Trash2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Calendar,
  Loader2,
  X,
} from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { transactionService, categoryService } from "../services/api";
import TransactionModal from "../components/TransactionModal";

export default function Transactions() {
  const { currentProfile } = useProfile();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'income' | 'expense'
  const [recurrenceFilter, setRecurrenceFilter] = useState("all"); // 'all' | 'unique' | 'installment' | 'subscription'
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Modal de Exclusão (Design System: Alerta Amarelo)
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transaction: null,
    loading: false,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        transactionService.list(currentProfile),
        categoryService.list(currentProfile),
      ]);
      setTransactions(txRes?.transactions || []);
      setCategories(catRes || []);
    } catch (err) {
      console.error("Erro ao carregar lançamentos:", err);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getCategory = (catId) => {
    return categories.find((c) => c.id === catId);
  };

  // Filtros aplicados
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch = tx.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesType =
        typeFilter === "all" ? true : tx.type === typeFilter;

      const matchesRecurrence =
        recurrenceFilter === "all"
          ? true
          : tx.type_recurrence === recurrenceFilter;

      const matchesCategory =
        selectedCategory === "all"
          ? true
          : tx.category_id === selectedCategory;

      return (
        matchesSearch &&
        matchesType &&
        matchesRecurrence &&
        matchesCategory
      );
    });
  }, [transactions, searchTerm, typeFilter, recurrenceFilter, selectedCategory]);

  // Totais dos itens filtrados
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const amt = parseFloat(tx.amount) || 0;
      if (tx.type === "income") income += amt;
      else expense += amt;
    });
    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [filteredTransactions]);

  const handleDelete = async () => {
    if (!deleteModal.transaction) return;

    try {
      setDeleteModal((prev) => ({ ...prev, loading: true }));
      await transactionService.delete(deleteModal.transaction.id);
      setDeleteModal({ isOpen: false, transaction: null, loading: false });
      loadData();
    } catch (err) {
      alert("Erro ao excluir lançamento: " + (err.message || "Tente novamente"));
      setDeleteModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="px-4 sm:px-8 py-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Lançamentos Financeiros
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie todas as suas receitas, despesas, parcelamentos e assinaturas
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Lançamento
        </button>
      </div>

      {/* ── Mini Cards de Resumo (Empilhados no mobile) ─────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-card">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Receitas Filtradas</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(filteredTotals.income)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-card">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Despesas Filtradas</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(filteredTotals.expense)}
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-950 dark:from-slate-900 dark:to-slate-950 text-white shadow-card border border-brand-800 dark:border-slate-800">
          <p className="text-xs font-semibold text-brand-300 dark:text-slate-400 uppercase tracking-wider">Balanço do Filtro</p>
          <p className="text-xl font-bold mt-1">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(filteredTotals.balance)}
          </p>
        </div>
      </div>

      {/* ── Barra de Busca e Filtros ────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-card flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors duration-200">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grupo de Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tipo */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
          >
            <option value="all">Todos os Tipos</option>
            <option value="income">Apenas Receitas</option>
            <option value="expense">Apenas Despesas</option>
          </select>

          {/* Modalidade / Recorrência */}
          <select
            value={recurrenceFilter}
            onChange={(e) => setRecurrenceFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
          >
            <option value="all">Todas as Modalidades</option>
            <option value="unique">Lançamentos Únicos</option>
            <option value="installment">Compras Parceladas</option>
            <option value="subscription">Assinaturas Mensais</option>
          </select>

          {/* Categoria */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer max-w-[160px] truncate"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Tabela de Lançamentos ───────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-card overflow-hidden transition-colors duration-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 dark:text-brand-400" />
            <p className="text-sm font-medium">Carregando seus lançamentos...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto mb-3">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Nenhum lançamento encontrado</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || typeFilter !== "all" || recurrenceFilter !== "all" || selectedCategory !== "all"
                ? "Tente ajustar os filtros acima para encontrar o que procura."
                : "Clique em 'Novo Lançamento' para cadastrar sua primeira transação."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Data</th>
                  <th className="py-3.5 px-6">Descrição & Detalhes</th>
                  <th className="py-3.5 px-6">Categoria</th>
                  <th className="py-3.5 px-6 text-right">Valor</th>
                  <th className="py-3.5 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {filteredTransactions.map((tx) => {
                  const cat = getCategory(tx.category_id);
                  const isIncome = tx.type === "income";

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Data */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                          {new Date(tx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </div>
                      </td>

                      {/* Descrição & Badges */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <div
                            className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                              isIncome
                                ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                                : "bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100">
                            {tx.description}
                          </span>

                          {/* Badge Amarela de Parcelamento */}
                          {tx.type_recurrence === "installment" && tx.installment_total && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-accent-100 dark:bg-accent-950/80 text-accent-900 dark:text-accent-300 ring-1 ring-accent-300 dark:ring-accent-700/60">
                              <Layers className="w-3 h-3" />
                              {tx.installment_current}/{tx.installment_total}
                            </span>
                          )}

                          {/* Badge Amarela de Assinatura */}
                          {tx.type_recurrence === "subscription" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-accent-100 dark:bg-accent-950/80 text-accent-900 dark:text-accent-300 ring-1 ring-accent-300 dark:ring-accent-700/60">
                              <RefreshCw className="w-3 h-3" />
                              Assinatura
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {cat ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                            style={{
                              backgroundColor: `${cat.color || "#3B82F6"}18`,
                              color: cat.color || "#1D4ED8",
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color || "#3B82F6" }}
                            />
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Sem categoria</span>
                        )}
                      </td>

                      {/* Valor */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {isIncome ? "+" : "-"}{" "}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(tx.amount)}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button
                          onClick={() => setDeleteModal({ isOpen: true, transaction: tx, loading: false })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de Confirmação de Exclusão (Alerta Amarelo de Risco) ── */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 border border-slate-100 dark:border-slate-800 p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-950/70 text-accent-700 dark:text-accent-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Excluir Lançamento?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <div className="p-3.5 bg-accent-50 dark:bg-accent-950/50 rounded-xl border border-accent-200 dark:border-accent-800 text-xs text-accent-900 dark:text-accent-200 font-medium space-y-1">
              <p>
                <strong className="text-accent-950 dark:text-white">Lançamento:</strong>{" "}
                {deleteModal.transaction?.description}
              </p>
              <p>
                <strong className="text-accent-950 dark:text-white">Valor:</strong>{" "}
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                  deleteModal.transaction?.amount || 0
                )}
              </p>
              {deleteModal.transaction?.type_recurrence === "installment" && (
                <p className="text-accent-700 dark:text-accent-400 pt-1 text-[11px]">
                  ⚠️ Atenção: Esta é a parcela {deleteModal.transaction.installment_current} de {deleteModal.transaction.installment_total}.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, transaction: null, loading: false })}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteModal.loading}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {deleteModal.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Novo Lançamento ───────────────────────────────── */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
}
