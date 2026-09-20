import { ArrowUpRight, ArrowDownRight, MoveUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export default function SummaryCard({ title, value, variant = "balance", icon: Icon, delay = 0 }) {
  const reduceMotion = useReducedMotion();
  const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
  const balance = variant === "balance";
  const number = balance ? "01" : variant === "income" ? "02" : "03";
  return <motion.article className={`trio-summary ${balance ? "trio-summary-balance" : `trio-summary-${variant}`} relative flex h-full min-h-[200px] flex-col justify-between overflow-hidden p-6 sm:p-7`} initial={reduceMotion ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} whileHover={reduceMotion ? undefined : { y: -3 }} transition={{ duration: .45, ease: [0.22, 1, 0.36, 1], delay: delay / 1000 }}>
    {balance && <span className="trio-summary-orbit" aria-hidden="true" />}
    <div className="relative flex items-start justify-between gap-3">
      <span className="trio-summary-index text-[11px] font-bold tracking-[.16em]">{number} / 03</span>
      <span className="trio-summary-icon grid size-10 shrink-0 place-items-center rounded-full"><Icon size={20} strokeWidth={1.8} /></span>
    </div>
    <div className="relative mt-6 min-w-0">
      <p className="trio-summary-label text-xs font-bold uppercase tracking-[.17em]">{title}</p>
      <p className={`trio-summary-value mt-2 break-words font-semibold tracking-[-.065em] leading-[1.05] tabular-nums ${balance ? "text-[clamp(2.5rem,5vw,4.4rem)]" : "text-[clamp(2rem,3vw,3.1rem)]"}`}>{formatted}</p>
      <div className="trio-summary-foot mt-6 flex items-center gap-1.5 text-xs font-medium">
        {balance ? <><MoveUpRight size={15} /> Panorama do perfil</> : <>{variant === "income" ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />} Total registrado</>}
      </div>
    </div>
  </motion.article>;
}
