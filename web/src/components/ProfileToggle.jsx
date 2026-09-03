import { useProfile } from "../context/ProfileContext";
import { User, Briefcase } from "lucide-react";

export default function ProfileToggle() {
  const { toggleProfile, isBusiness } = useProfile();

  return (
    <div className="relative flex items-center p-1 bg-slate-200/80 dark:bg-slate-950/80 backdrop-blur-md rounded-full shadow-inner w-[240px] h-10 border border-slate-300/50 dark:border-white/5">
      {/* Indicador de Fundo Deslizante (A Mágica da Animação) */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-md
          ${isBusiness ? "translate-x-full bg-blue-500" : "translate-x-0 bg-white dark:bg-slate-800"}`}
      />

      {/* Botão Vida Pessoal */}
      <button
        onClick={() => { if (isBusiness) toggleProfile(); }}
        className={`relative z-10 flex items-center justify-center gap-2 flex-1 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 cursor-pointer
          ${!isBusiness ? "text-blue-600 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}
        `}
      >
        <User className={`w-4 h-4 transition-transform duration-300 ${!isBusiness ? "scale-110" : ""}`} />
        Pessoal
      </button>

      {/* Botão Meu Negócio */}
      <button
        onClick={() => { if (!isBusiness) toggleProfile(); }}
        className={`relative z-10 flex items-center justify-center gap-2 flex-1 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 cursor-pointer
          ${isBusiness ? "text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"}
        `}
      >
        <Briefcase className={`w-4 h-4 transition-transform duration-300 ${isBusiness ? "scale-110" : ""}`} />
        Negócio
      </button>
    </div>
  );
}
