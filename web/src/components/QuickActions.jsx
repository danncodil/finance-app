import { ArrowLeftRight, ArrowUpRight, FileBarChart2, Tags } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { to: "/transactions", icon: ArrowLeftRight, eyebrow: "Movimentações", title: "Ver lançamentos", detail: "Consulte cada entrada e saída" },
  { to: "/categories", icon: Tags, eyebrow: "Organização", title: "Categorias", detail: "Dê contexto ao seu dinheiro" },
  { to: "/reports", icon: FileBarChart2, eyebrow: "Leitura", title: "Relatórios", detail: "Transforme dados em decisões" },
];

export default function QuickActions() {
  return <section className="grid grid-cols-1 gap-3 md:grid-cols-3 trio-enter" style={{ animationDelay: "350ms" }}>
    {actions.map(({ to, icon: Icon, eyebrow, title, detail }) => <Link key={to} to={to} className="trio-card group relative rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[.12] bg-white/[.055] text-white"><Icon className="h-4 w-4" /></span><ArrowUpRight className="h-4 w-4 text-[#8f8f8c] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-white" /></div>
      <p className="trio-kicker mt-8 text-[#a8a8a5]">{eyebrow}</p><h3 className="mt-2 text-lg font-semibold text-white">{title}</h3><p className="mt-1 text-sm text-[#a8a8a5]">{detail}</p>
    </Link>)}
  </section>;
}
