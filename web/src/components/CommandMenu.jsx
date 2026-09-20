import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Search, LayoutDashboard, ArrowLeftRight, Tags, Briefcase, Target, BarChart3, Settings, ArrowUpRight } from "lucide-react";
import { useProfile } from "../context/ProfileContext";

const pages = [
  { label: "Visão geral", path: "/", icon: LayoutDashboard },
  { label: "Lançamentos", path: "/transactions", icon: ArrowLeftRight },
  { label: "Categorias", path: "/categories", icon: Tags },
  { label: "Projetos", path: "/projects", icon: Briefcase, business: true },
  { label: "Metas", path: "/goals", icon: Target, personal: true },
  { label: "Relatórios", path: "/reports", icon: BarChart3 },
  { label: "Configurações", path: "/settings", icon: Settings },
];

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const { isBusiness } = useProfile();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const available = pages.filter(page => (!page.business || isBusiness) && (!page.personal || !isBusiness));
  const results = available.filter(page => page.label.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR")));

  useEffect(() => {
    const onKey = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(value => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("trio:open-command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("trio:open-command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelected(0);
    inputRef.current?.focus();
  }, [open]);

  const choose = page => {
    navigate(page.path);
    setOpen(false);
  };

  return <AnimatePresence>
    {open && <motion.div className="trio-command-backdrop fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[14vh]" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .16 }} onMouseDown={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <motion.div role="dialog" aria-modal="true" aria-label="Buscar páginas" className="trio-command-panel w-full max-w-[560px] overflow-hidden" initial={reduceMotion ? false : { opacity: 0, y: -14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: .98 }} transition={{ duration: .2, ease: "easeOut" }}>
        <div className="flex items-center gap-3 border-b border-black/10 px-5 py-5">
          <Search size={21} aria-hidden="true" />
          <input ref={inputRef} className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-500" placeholder="Para onde vamos?" aria-label="Buscar página" value={query} onChange={event => { setQuery(event.target.value); setSelected(0); }} onKeyDown={event => {
            if (event.key === "ArrowDown") { event.preventDefault(); setSelected(value => Math.min(value + 1, results.length - 1)); }
            if (event.key === "ArrowUp") { event.preventDefault(); setSelected(value => Math.max(value - 1, 0)); }
            if (event.key === "Enter" && results[selected]) choose(results[selected]);
          }} />
          <kbd className="rounded border border-black/15 px-1.5 py-0.5 text-[11px] text-stone-500">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          <p className="px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.2em] text-stone-500">Páginas</p>
          {results.length ? results.map((page, index) => <button key={page.path} type="button" onMouseEnter={() => setSelected(index)} onClick={() => choose(page)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${selected === index ? "bg-[#d9fb72] text-[#1c211a]" : "hover:bg-black/5"}`}>
            <page.icon size={18} aria-hidden="true" /><span className="flex-1">{page.label}</span><ArrowUpRight size={16} aria-hidden="true" />
          </button>) : <p className="px-3 py-8 text-sm text-stone-500">Nenhuma página encontrada.</p>}
        </div>
        <div className="border-t border-black/10 px-5 py-3 text-xs text-stone-500">Use ↑ ↓ para navegar e Enter para abrir</div>
      </motion.div>
    </motion.div>}
  </AnimatePresence>;
}
