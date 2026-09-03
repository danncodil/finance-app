// src/components/RecentTransactions.jsx
import { ArrowUpRight, ArrowDownRight, RefreshCw, Layers } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Lista as transações mais recentes no dashboard com suporte a Dark Mode e badges de recorrência/parcelamento.
 */
export default function RecentTransactions({ transactions = [], categories = [] }) {
  const getCategoryName = (categoryId) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : "Sem categoria";
  };

  return (
    <section
      className="
        bg-white dark:bg-slate-900/40 rounded-3xl dark:backdrop-blur-xl
        border border-slate-100 dark:border-white/5
        shadow-card overflow-hidden
        animate-fade-in-up transition-colors duration-200
      "
      style={{ animationDelay: "300ms" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 sm:px-7 py-4 sm:py-5 border-b border-slate-100 dark:border-white/5">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Últimos Lançamentos
        </h2>
        <Link
          to="/transactions"
          className="
            text-xs font-semibold text-brand-600 dark:text-brand-400
            hover:text-brand-700 dark:hover:text-brand-300 transition-colors
          "
        >
          Ver todos →
        </Link>
      </div>

      {/* Lista (Timeline fluida) */}
      <ul className="flex flex-col gap-2 p-3">
        {transactions.length === 0 ? (
          <li className="px-6 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            Nenhum lançamento encontrado neste período.
          </li>
        ) : (
          transactions.slice(0, 5).map((tx) => (
            <li
              key={tx.id}
              className="
                flex items-center justify-between p-4 rounded-2xl
                bg-transparent hover:bg-slate-50/80 dark:hover:bg-slate-800/60
                hover:-translate-y-0.5 transition-all duration-200 cursor-default
              "
            >
              {/* Lado esquerdo: ícone + info */}
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full shrink-0
                    ${
                      tx.type === "income"
                        ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    }
                  `}
                >
                  {tx.type === "income" ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {tx.description}
                    </p>

                    {tx.type_recurrence === "installment" && tx.installment_total && (
                      <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md border border-slate-700 font-medium">
                        ⏳ {tx.installment_current}/{tx.installment_total}
                      </span>
                    )}

                    {tx.type_recurrence === "subscription" && (
                      <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-md border border-slate-700 font-medium">
                        🔁 Fixa
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                    {getCategoryName(tx.category_id)}
                  </p>
                </div>
              </div>

              {/* Lado direito: valor + data */}
              <div className="text-right shrink-0 ml-3">
                <p
                  className={`text-sm font-black ${
                    tx.type === "income"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.type === "income" ? "+" : "-"}{" "}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(tx.amount)}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  {new Date(tx.transaction_date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                  })}
                </p>
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
