// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Tags, BarChart3, Settings, Briefcase, Target, Search } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Lançamentos" },
  { to: "/categories", icon: Tags, label: "Categorias" },
  { to: "/projects", icon: Briefcase, label: "Projetos", requiresBusiness: true },
  { to: "/goals", icon: Target, label: "Metas", requiresPersonal: true },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
];



export default function Sidebar() {
  const { isBusiness } = useProfile();
  return (
    <aside className="hidden md:flex w-[246px] min-h-screen shrink-0 flex-col border-r border-white/[.08] bg-[#151f16] p-4 z-30">
      <NavLink to="/" className="flex items-center gap-3 px-2 py-4 mb-8">
        <img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="TRIO" className="w-10 h-10 object-contain" />
        <div><span className="font-display text-[28px] tracking-[-.1em] font-bold text-white">trio<span className="text-brand-400">.</span></span><p className="text-[10px] tracking-[.18em] uppercase text-[#9dac96]">espaço financeiro</p></div>
      </NavLink>
      <p className="trio-kicker px-3 mb-3 text-[#9dac96]">Navegação</p>
      <nav className="space-y-1.5 flex-1">
        {NAV_ITEMS.filter(item => (!item.requiresBusiness || isBusiness) && (!item.requiresPersonal || !isBusiness)).map((item, index) => <SidebarLink key={item.to} {...item} index={index + 1} />)}
      </nav>
      <button onClick={() => window.dispatchEvent(new Event("trio:command"))} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[#cbd4c8] hover:bg-white/[.06] transition-colors text-left"><Search className="w-4 h-4" /><span className="flex-1">Busca rápida</span><kbd className="text-[10px] text-[#9dac96]">⌘ K</kbd></button>
      <NavLink to="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[#cbd4c8] hover:bg-white/[.06] transition-colors"><Settings className="w-4 h-4" />Configurações</NavLink>
      <div className="mt-4 rounded-2xl bg-brand-400 p-4 text-[#17210e] trio-shine"><p className="trio-kicker text-[#405421]">Seus próximos passos</p><p className="font-display text-lg font-semibold leading-tight mt-3">Veja o retrato completo das suas finanças.</p><NavLink to="/reports" className="inline-block mt-4 text-sm font-bold">Abrir relatórios ↗</NavLink></div>
    </aside>
  );
}

/** Link individual da sidebar com estilo ativo/inativo via NavLink. */
function SidebarLink({ to, icon: Icon, label, index }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-3 rounded-2xl
        text-sm transition-all duration-200 relative cursor-pointer group/link
        ${
          isActive
            ? "text-[#101711] font-bold bg-brand-400 shadow-[0_10px_30px_rgba(197,255,92,.16)]"
            : "text-[#cbd4c8] font-medium hover:bg-white/[.06] hover:text-white"
        }
        `
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="w-[18px] h-[18px] transition-transform duration-300 group-hover/link:scale-110" />
          <span className="flex-1">{label}</span><span className="text-[11px] opacity-55">0{index}</span>
        </>
      )}
    </NavLink>
  );
}
