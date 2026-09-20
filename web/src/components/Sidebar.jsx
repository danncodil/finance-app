import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Tags, BarChart3, Settings, Briefcase, Target, ArrowUpRight, Search } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

const navigation = [
  { to: "/", icon: LayoutDashboard, label: "Visão geral" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Lançamentos" },
  { to: "/categories", icon: Tags, label: "Categorias" },
  { to: "/projects", icon: Briefcase, label: "Projetos", business: true },
  { to: "/goals", icon: Target, label: "Metas", personal: true },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
];

export default function Sidebar() {
  const { isBusiness } = useProfile();
  return <aside className="trio-sidebar hidden md:flex w-[260px] shrink-0 flex-col" aria-label="Menu lateral">
    <div className="trio-sidebar-brand px-6 pt-8 pb-9">
      <NavLink to="/" className="flex items-center gap-3" aria-label="TRIO, visão geral">
        <span className="trio-logo-mark grid size-11 place-items-center"><img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="" className="size-8 object-contain" /></span>
        <span className="trio-sidebar-wordmark text-[28px] font-bold tracking-[-.07em]">trio<span className="text-[#a3cb31]">.</span></span>
      </NavLink>
      <p className="trio-sidebar-tagline mt-7 text-[11px] font-semibold tracking-[.18em] uppercase">Seu dinheiro, com direção.</p>
    </div>
    <nav className="flex-1 px-3" aria-label="Navegação principal">
      <p className="trio-sidebar-label px-4 mb-3 text-[10px] font-bold uppercase tracking-[.2em]">Navegação</p>
      <div className="space-y-1">
        {navigation.filter(item => (!item.business || isBusiness) && (!item.personal || !isBusiness)).map(({ to, icon: Icon, label }, index) => <NavLink key={to} to={to} end title={label} aria-label={label} className={({ isActive }) => `trio-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "is-active" : ""}`}>
          <Icon size={19} strokeWidth={1.8} /><span className="trio-nav-label flex-1">{label}</span><span className="trio-nav-index text-[10px] font-medium">0{index + 1}</span>
        </NavLink>)}
      </div>
      <div className="mt-7 border-t border-current/10 pt-5">
        <NavLink to="/settings" title="Configurações" aria-label="Configurações" className={({ isActive }) => `trio-nav-link flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? "is-active" : ""}`}><Settings size={19} /><span className="trio-nav-label">Configurações</span></NavLink>
      </div>
    </nav>
    <div className="trio-sidebar-bottom px-4 pb-5">
      <button type="button" onClick={() => window.dispatchEvent(new Event("trio:open-command"))} className="trio-sidebar-search flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm" aria-label="Buscar páginas"><Search size={18} /><span className="trio-nav-label flex-1 text-left">Busca rápida</span><kbd className="trio-nav-label text-[10px]">⌘ K</kbd></button>
      <NavLink to="/reports" className="trio-sidebar-tip mt-3 block rounded-2xl p-5">
        <span className="text-[10px] font-bold uppercase tracking-[.16em]">Explore seus dados</span>
        <p className="mt-3 text-lg font-semibold leading-tight">Veja o quadro completo.</p>
        <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold">Abrir relatórios <ArrowUpRight size={15} /></span>
      </NavLink>
    </div>
  </aside>;
}
