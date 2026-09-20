import { useProfile } from "../context/ProfileContext";
import { User, Briefcase } from "lucide-react";

export default function ProfileToggle() {
  const { toggleProfile, isBusiness } = useProfile();

  return (
    <div className="relative flex items-center p-1 bg-white/[.07] backdrop-blur-md rounded-full w-[240px] h-11 border border-white/[.1]">
      {/* Indicador de Fundo Deslizante (A Mágica da Animação) */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) shadow-md
          ${isBusiness ? "translate-x-full bg-brand-400" : "translate-x-0 bg-brand-400"}`}
      />

      {/* Botão Vida Pessoal */}
      <button
        onClick={() => { if (isBusiness) toggleProfile(); }}
        className={`relative z-10 flex items-center justify-center gap-2 flex-1 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 cursor-pointer
          ${!isBusiness ? "text-[#111111]" : "text-[#a8a8a5] hover:text-white"}
        `}
      >
        <User className={`w-4 h-4 transition-transform duration-300 ${!isBusiness ? "scale-110" : ""}`} />
        Pessoal
      </button>

      {/* Botão Meu Negócio */}
      <button
        onClick={() => { if (!isBusiness) toggleProfile(); }}
        className={`relative z-10 flex items-center justify-center gap-2 flex-1 py-1.5 text-xs font-bold rounded-full transition-colors duration-300 cursor-pointer
          ${isBusiness ? "text-[#111111]" : "text-[#a8a8a5] hover:text-white"}
        `}
      >
        <Briefcase className={`w-4 h-4 transition-transform duration-300 ${isBusiness ? "scale-110" : ""}`} />
        Negócio
      </button>
    </div>
  );
}
