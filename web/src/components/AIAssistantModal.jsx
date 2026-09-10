import { useRef, useState } from 'react';
import { Sparkles, X, Loader2, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { assistantService, projectService, categoryService, transactionService } from '../services/api';
import { fallbackCategory, findFallbackCategory, localDate, transactionPayload } from '../services/assistant';
import { useProfile } from '../context/ProfileContext';

const field = 'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white disabled:opacity-50';
const primary = 'w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed';
const label = 'block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5';

export default function AIAssistantModal({ onTransactionSaved }) {
  const { currentProfile } = useProfile();
  const profileRef = useRef(currentProfile);
  profileRef.current = currentProfile;
  const lock = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('input');
  const [text, setText] = useState('');
  const [automatic, setAutomatic] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);

  function open() {
    setText(''); setError(''); setData(null); setStep('input'); setUncertain(false); setIsOpen(true);
  }

  function close() {
    if (lock.current) return;
    setIsOpen(false);
    if (step === 'success' || uncertain) {
      if (onTransactionSaved) onTransactionSaved();
      else window.location.reload();
    }
  }

  async function save(proposal, profile, cats, projs) {
    const payload = transactionPayload(proposal, profile, cats, projs);
    if (profileRef.current !== profile) throw new Error('O perfil mudou. Analise a frase novamente.');
    try {
      // No retry after an uncertain write: the server may already have saved it.
      await transactionService.create(payload);
    } catch (err) {
      if (!err.status || err.status >= 500) {
        setUncertain(true);
        throw new Error('Não foi possível confirmar o salvamento. Feche o assistente e confira Lançamentos antes de tentar novamente, para evitar duplicidade.');
      }
      throw err;
    }
    setData({ ...proposal, amount: payload.amount });
    setStep('success');
  }

  async function ensureAutomaticCategory(proposal, profile, cats) {
    if (proposal.category_id) return { proposal, categories: cats };
    const fallback = fallbackCategory(proposal, profile);
    if (!fallback) return { proposal, categories: cats };
    let category = findFallbackCategory(cats, fallback);
    if (category) return { proposal: { ...proposal, category_id: category.id }, categories: cats };
    if (!category) {
      try {
        category = await categoryService.create(fallback);
      } catch (err) {
        // A concurrent request may have created it. Re-read before treating it as a failure.
        const refreshed = await categoryService.list(profile);
        const refreshedCategories = Array.isArray(refreshed) ? refreshed : [];
        category = findFallbackCategory(refreshedCategories, fallback);
        if (!category) throw err;
        return { proposal: { ...proposal, category_id: category.id }, categories: refreshedCategories };
      }
    }
    return { proposal: { ...proposal, category_id: category.id }, categories: [...cats, category] };
  }

  async function analyze() {
    if (lock.current || !text.trim()) return;
    lock.current = true; setBusy(true); setError('');
    const profile = currentProfile;
    try {
      const proposal = await assistantService.parse(text.trim(), { profileType: profile, referenceDate: localDate() });
      if (profileRef.current !== profile) throw new Error('O perfil mudou. Analise a frase novamente.');
      if (proposal.clarification) throw new Error(proposal.clarification);
      if (proposal.entry_kind !== 'single') throw new Error('Descreva uma movimentação por vez, à vista. Se acabou de atualizar o site, aguarde a atualização do servidor.');
      const [cats, projs] = await Promise.all([
        categoryService.list(profile),
        profile === 'business' ? projectService.list('active') : Promise.resolve([]),
      ]);
      const projectList = Array.isArray(projs) ? projs : (projs?.projects || []);
      let categoryList = Array.isArray(cats) ? cats : [];
      let resolvedProposal = proposal;
      if (automatic) {
        const resolved = await ensureAutomaticCategory(proposal, profile, categoryList);
        resolvedProposal = resolved.proposal;
        categoryList = resolved.categories;
      }
      if (profileRef.current !== profile) throw new Error('O perfil mudou. Analise a frase novamente.');
      setCategories(categoryList); setProjects(projectList); setData(resolvedProposal); setStep('review');
      if (automatic && resolvedProposal.category_id) {
        await save(resolvedProposal, profile, categoryList, projectList);
      }
    } catch (err) {
      setError(err.message || 'Não foi possível analisar a frase. Tente novamente.');
    } finally {
      lock.current = false; setBusy(false);
    }
  }

  async function confirm() {
    if (lock.current || uncertain) return;
    lock.current = true; setBusy(true); setError('');
    try { await save(data, currentProfile, categories, projects); }
    catch (err) { setError(err.message || 'Não foi possível salvar o lançamento.'); }
    finally { lock.current = false; setBusy(false); }
  }

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }));
  const matchingCategories = categories.filter(c => c.type === data?.transaction_type);

  return <>
    <button onClick={open} aria-label="Assistente de IA" className="fixed bottom-[84px] left-4 md:left-auto md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg flex items-center justify-center">
      <img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="Assistente TRIO" className="w-7 h-7 object-contain" />
    </button>
    {isOpen && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3"><Sparkles className="w-6 h-6 text-blue-500" /><div>
            <h2 id="assistant-title" className="text-base font-bold text-slate-900 dark:text-white">Assistente Inteligente</h2>
            <p className="text-xs text-blue-500">Perfil {currentProfile === 'business' ? 'Negócio' : 'Pessoal'} · Gemini</p>
          </div></div>
          <button onClick={close} disabled={busy} aria-label="Fechar assistente" className="p-2 text-slate-400 disabled:opacity-30"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-4">
          {error && <div role="alert" className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-sm flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
          {step === 'input' && <>
            <div><label htmlFor="assistant-text" className={label}>Descreva a movimentação:</label>
              <textarea id="assistant-text" rows={4} maxLength={2000} value={text} disabled={busy} onChange={e => setText(e.target.value)} placeholder="Ex.: Comprei um bombom por 1 real hoje" className={field} />
            </div>
            <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input type="checkbox" checked={automatic} disabled={busy} onChange={e => setAutomatic(e.target.checked)} className="mt-1" />
              <span>Registrar automaticamente<span className="block text-xs text-slate-500 mt-1">Se os dados estiverem completos, salva ao enviar. Desmarque para revisar antes.</span></span>
            </label>
            <p className="text-xs text-slate-500">Uma movimentação por vez. A descrição e os nomes de categorias/projetos são enviados ao Google para interpretar o lançamento. Evite incluir dados sensíveis.</p>
            <button onClick={analyze} disabled={busy || !text.trim()} className={primary}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{busy ? 'Processando...' : automatic ? 'Registrar com IA' : 'Analisar e revisar'}</button>
          </>}
          {step === 'review' && data && <>
            <h3 className="font-bold text-slate-900 dark:text-white">Revise o lançamento</h3>
            {!data.category_id && <p className="text-sm text-amber-600 dark:text-amber-400">Não encontrei uma categoria adequada. Escolha abaixo antes de salvar.</p>}
            <div><label htmlFor="assistant-description" className={label}>Descrição</label><input id="assistant-description" value={data.description} onChange={e => update('description', e.target.value)} maxLength={500} disabled={busy || uncertain} className={field} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="assistant-amount" className={label}>Valor (R$)</label><input id="assistant-amount" type="number" min="0.01" step="0.01" value={data.amount ?? ''} disabled={busy || uncertain} onChange={e => update('amount', e.target.value)} className={field} /></div>
              <div><label htmlFor="assistant-date" className={label}>Data</label><input id="assistant-date" type="date" value={data.transaction_date || ''} disabled={busy || uncertain} onChange={e => update('transaction_date', e.target.value)} className={field} /></div>
            </div>
            <div><label htmlFor="assistant-type" className={label}>Tipo</label><select id="assistant-type" value={data.transaction_type || ''} disabled={busy || uncertain} onChange={e => setData(prev => ({ ...prev, transaction_type: e.target.value, category_id: null }))} className={field}><option value="expense">Despesa</option><option value="income">Receita</option></select></div>
            <div><label htmlFor="assistant-category" className={label}>Categoria</label><select id="assistant-category" value={data.category_id || ''} disabled={busy || uncertain} onChange={e => update('category_id', e.target.value)} className={field}><option value="">Selecione uma categoria</option>{matchingCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              {!matchingCategories.length && <p className="text-xs text-amber-600 mt-2">Crie uma categoria deste tipo em Categorias e analise a frase novamente.</p>}
            </div>
            {data.profile_type === 'business' && <div><label htmlFor="assistant-project" className={label}>Projeto (opcional)</label><select id="assistant-project" value={data.project_id || ''} disabled={busy || uncertain} onChange={e => update('project_id', e.target.value || null)} className={field}><option value="">Sem projeto</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>}
            <button onClick={confirm} disabled={busy || uncertain || !data.category_id} className={primary}>{busy && <Loader2 className="w-4 h-4 animate-spin" />}Confirmar e salvar</button>
            {!uncertain && <button disabled={busy} onClick={() => { setStep('input'); setError(''); }} className="text-sm text-slate-500">Editar a frase</button>}
          </>}
          {step === 'success' && data && <div role="status" className="space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Lançamento salvo!</h3>
            <p className="text-slate-600 dark:text-slate-300">{data.description} · {Number(data.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p className="text-sm text-slate-500">{data.transaction_type === 'income' ? 'Receita' : 'Despesa'} · {categories.find(c => c.id === data.category_id)?.name} · {data.transaction_date.split('-').reverse().join('/')}</p>
            <p className="text-xs text-slate-500">Você pode editar ou excluir este registro em Lançamentos.</p>
            <button onClick={close} className={primary}>Concluir e atualizar</button>
          </div>}
        </div>
      </div>
    </div>}
  </>;
}
