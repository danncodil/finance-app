import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, LayoutDashboard, Search, Settings, Tags, Target, X, ArrowLeftRight, Briefcase } from "lucide-react";

const commands = [
  ["Visão geral", "/", LayoutDashboard], ["Lançamentos", "/transactions", ArrowLeftRight], ["Categorias", "/categories", Tags], ["Metas", "/goals", Target], ["Projetos", "/projects", Briefcase], ["Relatórios", "/reports", BarChart3], ["Configurações", "/settings", Settings],
];

export default function CommandMenu() {
  const navigate = useNavigate(); const [open, setOpen] = useState(false); const [query, setQuery] = useState("");
  useEffect(() => { const handler = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(v => !v); } if (event.key === "Escape") setOpen(false); }; const external = () => setOpen(true); window.addEventListener("keydown", handler); window.addEventListener("trio:command", external); return () => { window.removeEventListener("keydown", handler); window.removeEventListener("trio:command", external); }; }, []);
  const filtered = useMemo(() => commands.filter(([label]) => label.toLowerCase().includes(query.toLowerCase())), [query]);
  if (!open) return null;
  const go = (path) => { navigate(path); setOpen(false); setQuery(""); };
  return <div role="dialog" aria-modal="true" aria-label="Busca rápida" onMouseDown={() => setOpen(false)} className="fixed inset-0 z-[100] grid place-items-start pt-[18vh] bg-black/70 backdrop-blur-sm px-4">
    <div onMouseDown={e => e.stopPropagation()} className="w-full max-w-xl rounded-3xl border border-white/[.12] bg-[#151515] shadow-[0_30px_80px_rgba(0,0,0,.55)] overflow-hidden trio-enter">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[.08]"><Search className="w-5 h-5 text-brand-400" /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Para onde você quer ir?" className="flex-1 bg-transparent outline-none text-white placeholder:text-[#7e7e7b]" /><button onClick={() => setOpen(false)} className="rounded-lg p-1 text-[#a3a3a0] hover:text-white"><X className="w-5 h-5" /></button></div>
      <div className="p-2">{filtered.map(([label, path, Icon]) => <button key={path} onClick={() => go(path)} className="w-full flex items-center gap-3 rounded-2xl p-3 text-left text-[#e2e2df] hover:bg-brand-400 hover:text-[#111111] transition-colors"><span className="grid place-items-center w-9 h-9 rounded-xl bg-white/[.06]"><Icon className="w-4 h-4" /></span><span className="flex-1 font-medium">{label}</span><ArrowRight className="w-4 h-4 opacity-55" /></button>)}</div>
      <div className="px-5 py-3 border-t border-white/[.08] text-xs text-[#999996]">Use <kbd className="rounded bg-white/[.08] px-1.5 py-0.5">Esc</kbd> para fechar</div>
    </div>
  </div>;
}
