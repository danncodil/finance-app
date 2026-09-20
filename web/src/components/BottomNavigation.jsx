import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, BarChart3, Briefcase, Target, Settings, Tags } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

export default function BottomNavigation() {
  const { isBusiness } = useProfile();
  const items = [
    { to: "/", icon: LayoutDashboard, label: "Início" },
    { to: "/transactions", icon: ArrowLeftRight, label: "Extrato" },
    { to: "/categories", icon: Tags, label: "Categorias" },
    { to: isBusiness ? "/projects" : "/goals", icon: isBusiness ? Briefcase : Target, label: isBusiness ? "Projetos" : "Metas" },
    { to: "/reports", icon: BarChart3, label: "Análises" },
    { to: "/settings", icon: Settings, label: "Ajustes" },
  ];
  return <nav className="trio-bottom-nav md:hidden fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-40 flex items-center justify-around rounded-[20px] px-2 py-2" aria-label="Navegação principal">
    {items.map(({ to, icon: Icon, label }) => <NavLink key={to} to={to} end aria-label={label} className={({ isActive }) => `trio-bottom-link flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[13px] py-2 text-[9px] font-semibold transition-colors ${isActive ? "is-active" : ""}`}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></NavLink>)}
  </nav>;
}
