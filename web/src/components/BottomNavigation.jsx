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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#152016]/95 backdrop-blur-xl border-t border-white/[.1] shadow-[0_-8px_30px_rgba(0,0,0,0.24)] z-40 pb-safe">
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
                    ? "text-brand-400"
                    : "text-[#8e9c89] hover:text-[#dce5d8]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Ponto indicador animado (estilo iOS) */}
                  {isActive && (
                    <div className="absolute top-0 w-8 h-1 bg-brand-400 rounded-b-full drop-shadow-[0_2px_8px_rgba(197,255,92,.4)] animate-fade-in-down" />
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
