import { NavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, Tags, Settings, Briefcase, Target } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Home" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Extrato" },
  { to: "/categories", icon: Tags, label: "Tags" },
  { to: "/projects", icon: Briefcase, label: "Projetos", requiresBusiness: true },
  { to: "/goals", icon: Target, label: "Metas", requiresPersonal: true },
  { to: "/settings", icon: Settings, label: "Menu" },
];

export default function BottomNavigation() {
  const { isBusiness } = useProfile();

  // Filtrar os itens baseados no tipo de perfil
  const items = NAV_ITEMS.filter(item => 
    (!item.requiresBusiness || isBusiness) && 
    (!item.requiresPersonal || !isBusiness)
  );

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-40 pb-safe">
      <nav className="flex items-center justify-around h-[68px] px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 relative group
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Ponto indicador animado (estilo iOS) */}
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-blue-500 rounded-b-full drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)] animate-fade-in-down" />
                  )}
                  
                  <div className={`transition-transform duration-300 ${isActive ? '-translate-y-1' : 'translate-y-1'}`}>
                    <Icon className={`w-[22px] h-[22px] ${isActive ? 'drop-shadow-sm' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <span className={`text-[10px] font-medium transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
