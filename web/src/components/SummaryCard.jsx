// src/components/SummaryCard.jsx
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

/**
 * Card de resumo financeiro reutilizável com suporte a Modo Escuro.
 */
export default function SummaryCard({
  title,
  value,
  variant = "balance",
  icon: Icon,
  trend,
  delay = 0,
  isGiant = false,
}) {
  const isNegativeBalance = variant === "balance" && value < 0;

  // Mapeamento de estilos por variante
  const styles = {
    balance: {
      ring: isNegativeBalance
        ? "ring-rose-500/20 dark:ring-rose-500/30"
        : "ring-blue-500/20 dark:ring-slate-800",
      iconBg: isNegativeBalance
        ? "bg-rose-50 dark:bg-rose-950/50"
        : "bg-blue-50 dark:bg-blue-950/30",
      iconColor: isNegativeBalance
        ? "text-rose-600 dark:text-rose-400"
        : "text-blue-600 dark:text-blue-400",
      valuePre: isNegativeBalance ? "- " : "",
      valueColor: isNegativeBalance
        ? "text-rose-600 dark:text-rose-400"
        : "text-slate-900 dark:text-white",
      barColor: isNegativeBalance
        ? "bg-rose-500"
        : "bg-blue-500",
    },
    income: {
      ring: "ring-emerald-500/20 dark:ring-emerald-500/30 animate-pulse-glow",
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valuePre: "+ ",
      valueColor: "text-emerald-700 dark:text-emerald-400",
      barColor: "bg-emerald-500",
    },
    expense: {
      ring: "ring-rose-500/20 dark:ring-rose-500/30",
      iconBg: "bg-rose-50 dark:bg-rose-950/50",
      iconColor: "text-rose-600 dark:text-rose-400",
      valuePre: "- ",
      valueColor: "text-rose-700 dark:text-rose-400",
      barColor: "bg-rose-500",
    },
  };

  const s = styles[variant];

  // Formata valor monetário em BRL
  const formatted = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Math.abs(value));

  // Determina ícone e cor da tendência
  const TrendIcon =
    trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0
      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60"
      : trend < 0
        ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60"
        : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800";

  return (
    <article
      className={`
        group relative overflow-hidden
        bg-white dark:bg-slate-900/40 rounded-3xl p-7
        ring-1 ${s.ring} border border-slate-100 dark:border-white/5 dark:backdrop-blur-xl
        shadow-card hover:shadow-card-hover
        transition-all duration-300 ease-out
        hover:-translate-y-1 hover:bg-slate-50 dark:hover:bg-slate-900/60
        animate-fade-in-up
        ${isGiant ? 'flex flex-col justify-center h-full min-h-[220px]' : ''}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Barra decorativa superior */}
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${s.barColor} rounded-t-2xl`}
      />

      {/* Header: ícone + título */}
      <div className="flex items-start justify-between mb-4 z-10 relative">
        <div>
          <p className={`${isGiant ? 'text-base mb-2' : 'text-sm mb-1'} font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase`}>
            {title}
          </p>
          <p className={`${isGiant ? 'text-5xl md:text-6xl' : 'text-3xl'} font-extrabold tracking-tighter ${s.valueColor}`}>
            {s.valuePre}
            {formatted}
          </p>
        </div>

        {/* Ícone com fundo */}
        <div
          className={`
            flex items-center justify-center w-11 h-11 rounded-xl
            ${s.iconBg} ${s.iconColor}
            transition-transform duration-300 group-hover:scale-110 shadow-sm
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Badge de tendência (se fornecido) */}
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md
              text-xs font-bold ${trendColor}
            `}
          >
            <TrendIcon className="w-3 h-3" />
            {Math.abs(trend)}%
          </span>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide uppercase">vs. mês anterior</span>
        </div>
      )}

      {/* Marca d'água corporativa no Saldo Geral */}
      {variant === "balance" && (
        <img 
          src="/simbolo-trio.png" 
          alt="" 
          className={`absolute object-contain pointer-events-none group-hover:scale-105 transition-transform duration-700 ease-out ${
            isGiant
              ? 'bottom-0 right-0 w-80 h-80 opacity-50 dark:opacity-10 mix-blend-multiply dark:mix-blend-normal translate-x-12 translate-y-12 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]'
              : '-bottom-8 -right-8 w-40 h-40 opacity-50 dark:opacity-[0.03] mix-blend-multiply dark:mix-blend-normal'
          }`}
          aria-hidden="true"
        />
      )}
    </article>
  );
}
