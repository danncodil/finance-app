import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function SummaryCard({ title, value, variant = "balance", icon: Icon, trend, delay = 0, isGiant = false }) {
  const negative = variant === "balance" && value < 0;
  const amount = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Math.abs(value));
  const state = variant === "income"
    ? { label: "Entradas", color: "#63efbd", icon: "bg-[#153a2c] text-[#63efbd]" }
    : variant === "expense"
      ? { label: "Saídas", color: "#ff8593", icon: "bg-[#3b2025] text-[#ff8593]" }
      : { label: negative ? "Atenção ao fluxo" : "Disponível agora", color: "#f2f2ef", icon: "bg-[#f2f2ef] text-[#161616]" };
  const Trend = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;

  return <article style={{ animationDelay: `${delay}ms` }} className={`trio-card trio-enter group relative overflow-hidden rounded-[28px] p-6 ${isGiant ? "trio-aurora min-h-[238px] sm:p-8" : "min-h-[112px]"}`}>
    <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/[.09] transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full border border-white/[.07]" />
    <div className="relative flex h-full flex-col justify-between">
      <div className="flex items-start justify-between gap-4">
        <div><p className="trio-kicker text-[#b9b9b6]">{title}</p><p className={`${isGiant ? "mt-4 text-[clamp(2.55rem,5vw,4.5rem)]" : "mt-3 text-3xl"} font-display font-semibold tracking-[-.075em] text-[#f4f4f1] leading-none`}>{negative ? "− " : variant === "income" ? "+ " : variant === "expense" ? "− " : ""}{amount}</p></div>
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${state.icon}`}><Icon className="h-5 w-5" /></span>
      </div>
      <div className="mt-7 flex items-center gap-2 text-xs text-[#b9b9b6]">{trend !== undefined && <span className="inline-flex items-center gap-1 rounded-full border border-white/[.1] bg-black/[.12] px-2 py-1 font-semibold" style={{ color: state.color }}><Trend className="h-3 w-3" />{Math.abs(trend)}%</span>}<span>{state.label}</span></div>
    </div>
  </article>;
}
