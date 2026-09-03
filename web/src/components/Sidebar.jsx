// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  X,
  Briefcase,
  Target,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
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
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { isBusiness } = useProfile();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white/80 dark:bg-slate-900/50 backdrop-blur-3xl transition-all duration-300 shadow-sidebar z-20">
      {/* ── Header da Sidebar ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-100 dark:border-white/5 h-[76px] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap w-full">
          <img src="/simbolo-trio.png" alt="Símbolo TRIO" className="w-9 h-9 shrink-0 object-contain drop-shadow-md" />
          
          <div className="flex flex-col justify-center transition-opacity duration-300 md:opacity-0 group-hover:opacity-100">
            <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-[0.2em] leading-none drop-shadow-sm pb-1">
              TRIO
            </span>
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">
              Gestão Financeira Integrada
            </span>
          </div>
        </div>
      </div>

      {/* ── Navegação principal ────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
        <div className="h-6 flex items-center px-2 mb-2 overflow-hidden whitespace-nowrap">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 transition-opacity duration-300 md:opacity-0 group-hover:opacity-100">
            Menu Principal
          </p>
        </div>

        {NAV_ITEMS.filter(item => 
          (!item.requiresBusiness || isBusiness) && 
          (!item.requiresPersonal || !isBusiness)
        ).map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>



      {/* ── Rodapé com versão ──────────────────────────────────────── */}
      <div className="px-5 py-3 border-t border-slate-100 dark:border-white/5 h-10 overflow-hidden whitespace-nowrap">
        <p className="text-[10px] text-slate-400 transition-opacity duration-300 md:opacity-0 group-hover:opacity-100">
          v2.0.0 — © 2026
        </p>
      </div>
    </div>
  );

  return (
    <aside className="hidden md:block w-[76px] min-h-screen shrink-0 relative group z-50">
      <div className="absolute top-0 left-0 h-full w-[76px] group-hover:w-72 transition-all duration-300 ease-out overflow-hidden shadow-2xl group-hover:shadow-[10px_0_30px_rgba(0,0,0,0.1)] dark:group-hover:shadow-[10px_0_30px_rgba(0,0,0,0.5)] border-r border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-950">
        {sidebarContent}
      </div>
    </aside>
  );
}

/** Link individual da sidebar com estilo ativo/inativo via NavLink. */
function SidebarLink({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        `
        flex items-center gap-3 px-3 py-2.5 rounded-xl
        text-sm transition-all duration-200 relative cursor-pointer group/link
        hover:translate-x-1 overflow-hidden whitespace-nowrap
        ${
          isActive
            ? "text-blue-700 dark:text-white font-bold bg-blue-50 dark:bg-blue-500/10 shadow-[0_4px_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20"
            : "text-slate-500 dark:text-slate-400 font-medium hover:bg-slate-50 dark:hover:bg-white/5 hover:text-blue-600 dark:hover:text-white"
        }
        `
      }
    >
      {({ isActive }) => (
        <>
          {/* Indicador magnético lateral ativo */}
          {isActive && (
            <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.6)]" />
          )}
          <div className="shrink-0 flex items-center justify-center w-[18px]">
            <Icon
              className={`w-[18px] h-[18px] transition-transform duration-300 group-hover/link:scale-110 ${
                isActive ? "text-blue-600 dark:text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.4)]" : ""
              }`}
            />
          </div>
          <span className="transition-opacity duration-300 md:opacity-0 group-hover:opacity-100">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}
