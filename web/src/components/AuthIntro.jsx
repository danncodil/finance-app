import { ArrowUpRight, CircleDollarSign, Layers3, Target } from "lucide-react";

export default function AuthIntro() {
  return <div className="trio-auth-intro hidden lg:flex flex-col justify-between" aria-label="Sobre o TRIO">
    <div className="flex items-center gap-2 text-sm font-bold tracking-[-.03em]"><span className="trio-auth-intro-mark grid size-9 place-items-center rounded-full"><img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="" className="size-6 object-contain" /></span> trio.</div>
    <div>
      <p className="text-xs font-bold tracking-[.2em] uppercase">O seu espaço financeiro</p>
      <h2 className="mt-6 max-w-[610px] text-[clamp(3.7rem,5vw,6.5rem)] font-semibold leading-[.94] tracking-[-.085em]">Organize hoje.<br /><em>Enxergue além.</em></h2>
      <p className="mt-7 max-w-[420px] text-base leading-relaxed">Receitas, despesas, metas e projetos reunidos para você tomar decisões com mais clareza.</p>
      <div className="mt-9 flex flex-wrap gap-2 text-xs font-semibold">
        <span><CircleDollarSign size={16} /> Lançamentos</span><span><Target size={16} /> Metas</span><span><Layers3 size={16} /> Projetos</span>
      </div>
    </div>
    <span className="flex items-center gap-2 text-xs font-bold">UM NOVO OLHAR PARA O SEU DINHEIRO <ArrowUpRight size={16} /></span>
  </div>;
}
