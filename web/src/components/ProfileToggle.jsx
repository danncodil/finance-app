import { useProfile } from "../context/ProfileContext";
import { User, Briefcase } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

export default function ProfileToggle() {
  const { toggleProfile, isBusiness } = useProfile();
  const reduceMotion = useReducedMotion();
  return <div className="trio-profile-toggle relative flex items-center rounded-full p-1" role="group" aria-label="Perfil financeiro">
    <motion.span className="trio-profile-indicator absolute inset-y-1 w-[calc(50%-4px)] rounded-full" animate={{ x: isBusiness ? "100%" : "0%" }} transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 430, damping: 32 }} aria-hidden="true" />
    <button type="button" aria-pressed={!isBusiness} onClick={() => { if (isBusiness) toggleProfile(); }} className={`relative z-10 flex w-[108px] items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold ${!isBusiness ? "is-selected" : ""}`}><User size={15} /> Pessoal</button>
    <button type="button" aria-pressed={isBusiness} onClick={() => { if (!isBusiness) toggleProfile(); }} className={`relative z-10 flex w-[108px] items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold ${isBusiness ? "is-selected" : ""}`}><Briefcase size={15} /> Negócio</button>
  </div>;
}
