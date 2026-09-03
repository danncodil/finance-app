import { useState, useEffect } from "react";
import { Sparkles, X, Loader2, Send, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { assistantService, projectService, categoryService, transactionService } from "../services/api";

export default function AIAssistantModal({ onTransactionSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Input, 2: Review
  
  // Step 1 State
  const [text, setText] = useState("");
  const [loadingParse, setLoadingParse] = useState(false);
  const [error, setError] = useState("");

  // Step 2 State
  const [parsedData, setParsedData] = useState(null);
  
  // Step 3 State (Dependencies)
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loadingDeps, setLoadingDeps] = useState(false);
  const [saving, setSaving] = useState(false);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setText("");
      setParsedData(null);
      setError("");
      setSelectedProjectId("");
      setSelectedCategoryId("");
    }
  }, [isOpen]);

  // Handle parsing natural language
  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Por favor, digite ou cole um lançamento.");
      return;
    }

    try {
      setLoadingParse(true);
      setError("");
      
      const data = await assistantService.parse(text);
      
      // Validações básicas de fallback
      const validData = {
        amount: data.amount || 0,
        description: data.description || "Lançamento via IA",
        transaction_type: data.transaction_type === "income" ? "income" : "expense",
        profile_type: data.profile_type === "business" ? "business" : "personal"
      };

      setParsedData(validData);
      setStep(2);
      await fetchDependencies(validData.transaction_type, validData.profile_type);
      
    } catch (err) {
      setError(err.message || "Erro ao comunicar com a inteligência artificial.");
    } finally {
      setLoadingParse(false);
    }
  };

  // Fetch categories (and projects if business)
  const fetchDependencies = async (txType, profileType) => {
    try {
      setLoadingDeps(true);
      const catsData = await categoryService.list(profileType);
      const allCats = Array.isArray(catsData) ? catsData : [];
      const filteredCats = allCats.filter(c => c.type === txType);
      
      setCategories(filteredCats);
      if (filteredCats.length > 0) {
        setSelectedCategoryId(filteredCats[0].id); // Auto-select first
      }

      if (profileType === "business") {
        const projsData = await projectService.list("active");
        const list = Array.isArray(projsData) ? projsData : (projsData?.projects || []);
        setProjects(list);
      }
    } catch (err) {
      console.error("Erro ao carregar dependências do assistente:", err);
    } finally {
      setLoadingDeps(false);
    }
  };

  // Handle save
  const handleConfirm = async () => {
    if (!selectedCategoryId) {
      setError("É necessário selecionar uma categoria.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        description: parsedData.description,
        amount: parsedData.amount.toString(),
        transaction_date: new Date().toISOString().split("T")[0],
        type: parsedData.transaction_type,
        category_id: selectedCategoryId,
        type_recurrence: "unique",
        profile_type: parsedData.profile_type,
        project_id: (parsedData.profile_type === "business" && selectedProjectId) ? selectedProjectId : null,
      };

      await transactionService.create(payload);
      setIsOpen(false);
      
      // Trigger dashboard refresh if callback provided
      if (onTransactionSaved) {
        onTransactionSaved();
      } else {
        // Fallback refresh
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || "Erro ao salvar transação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[84px] left-4 md:left-auto md:bottom-6 md:right-6 z-40 w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center group"
        aria-label="Assistente de IA"
      >
        <img src="/simbolo-trio.png" alt="Assistente TRIO" className="w-7 h-7 object-contain drop-shadow-md" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Assistente Inteligente</h2>
                  <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Powered by Gemini</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-white/50 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto">
              
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 ring-1 ring-rose-200 dark:ring-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Input */}
              {step === 1 && (
                <div className="space-y-4 animate-fade-in-up">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Descreva a movimentação:
                    </label>
                    <textarea
                      rows="4"
                      placeholder="Ex: Comprei 450 reais de fios e disjuntores para a obra da padaria hoje..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-slate-400"
                      disabled={loadingParse}
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={loadingParse || !text.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loadingParse ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Analisar
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Review & Dependencies */}
              {step === 2 && parsedData && (
                <div className="space-y-5 animate-fade-in-up">
                  
                  {/* Review Card */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 ring-1 ring-slate-200 dark:ring-slate-700 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Dados Extraídos</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedData.amount)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</p>
                        {parsedData.transaction_type === 'income' ? (
                           <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Receita</span>
                        ) : (
                           <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400">Despesa</span>
                        )}
                      </div>

                      <div className="col-span-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</p>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{parsedData.description}</p>
                      </div>

                      <div className="col-span-2">
                         <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Perfil Sugerido</p>
                         {parsedData.profile_type === 'business' ? (
                           <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-700 dark:text-accent-400">
                             <div className="w-2 h-2 rounded-full bg-accent-500"></div> Meu Negócio
                           </span>
                         ) : (
                           <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 dark:text-brand-400">
                             <div className="w-2 h-2 rounded-full bg-brand-500"></div> Vida Pessoal
                           </span>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* Vínculos (Categoria / Projeto) */}
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Categoria *
                      </label>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
                        disabled={loadingDeps || categories.length === 0}
                      >
                        <option value="">Selecione uma categoria...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {parsedData.profile_type === 'business' && (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Vincular a Obra/Projeto (Opcional)
                        </label>
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer disabled:opacity-50"
                          disabled={loadingDeps}
                        >
                          <option value="">Nenhum projeto vinculado</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      disabled={saving}
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={saving || !selectedCategoryId}
                      className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Confirmar e Salvar
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
