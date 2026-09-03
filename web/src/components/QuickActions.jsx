// src/components/QuickActions.jsx
import { Plus, FileDown, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Barra de ações rápidas do dashboard com suporte a Dark Mode.
 */
export default function QuickActions() {
  return (
    <div
      className="flex flex-wrap items-center gap-3 animate-fade-in-up"
      style={{ animationDelay: "350ms" }}
    >
      {/* Botão para página de Lançamentos */}
      <Link
        to="/transactions"
        className="
          inline-flex items-center gap-2 px-4 py-2.5
          bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium
          rounded-xl ring-1 ring-slate-200 dark:ring-slate-800
          hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400
          active:scale-[0.97]
          transition-all duration-200 cursor-pointer shadow-sm
        "
      >
        <ArrowLeftRight className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        Ver Todos Lançamentos
      </Link>

      {/* Botão rápido para Relatórios */}
      <Link
        to="/reports"
        className="
          inline-flex items-center gap-2 px-4 py-2.5
          bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium
          rounded-xl ring-1 ring-slate-200 dark:ring-slate-800
          hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-400
          active:scale-[0.97]
          transition-all duration-200 cursor-pointer shadow-sm
        "
      >
        <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        Relatórios Financeiros
      </Link>
    </div>
  );
}
