import { ArrowUpRight, BriefcaseBusiness, CircleDollarSign, Target } from "lucide-react";

const points = [[CircleDollarSign, "Lançamentos"], [Target, "Metas"], [BriefcaseBusiness, "Projetos"]];

export default function AuthIntro({ register = false }) {
  return <section className="auth-intro relative hidden min-h-screen flex-col justify-between overflow-hidden p-10 lg:flex">
    <div><div className="flex items-center gap-3"><img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="TRIO" className="h-11 w-11 object-contain grayscale" /><span className="font-display text-3xl font-bold tracking-[-.1em] text-[#141414]">trio<span className="text-[#555]">.</span></span></div></div>
    <div className="relative z-10 max-w-xl"><p className="trio-kicker text-[#585856]">Seu espaço financeiro</p><h1 className="mt-7 font-display text-6xl font-semibold leading-[.91] tracking-[-.075em] text-[#101010]">{register ? <>Comece com <span className="text-[#555]">clareza.</span></> : <>Organize hoje.<br />Enxergue <span className="text-[#555]">além.</span></>}</h1><p className="mt-7 max-w-md text-lg leading-relaxed text-[#3f3f3d]">Receitas, despesas, metas e projetos reunidos para você decidir com mais segurança.</p><div className="mt-9 flex flex-wrap gap-3">{points.map(([Icon, label]) => <span key={label} className="inline-flex items-center gap-2 rounded-full border border-[#777]/45 px-4 py-2 text-sm font-semibold text-[#202020]"><Icon className="h-4 w-4" />{label}</span>)}</div></div>
    <p className="relative z-10 flex items-center gap-2 text-xs font-bold uppercase tracking-[.16em] text-[#30302e]">Um novo olhar para o seu dinheiro <ArrowUpRight className="h-4 w-4" /></p>
    <div className="auth-orbit auth-orbit-one" /><div className="auth-orbit auth-orbit-two" />
  </section>;
}
