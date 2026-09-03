// src/components/TransactionModal.jsx
import { useState, useEffect } from "react";
import { X, Loader2, RefreshCw, Layers } from "lucide-react";
import { useProfile } from "../context/ProfileContext";
import { categoryService, transactionService, projectService } from "../services/api";

export default function TransactionModal({ isOpen, onClose, onSuccess }) {
  const { currentProfile, isBusiness } = useProfile();
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    transaction_date: new Date().toISOString().split("T")[0],
    type: "expense",
    category_id: "",
    is_recurring: false,
    recurrence_type: "installment", // 'installment' | 'subscription'
    installment_total: 12,
    project_id: "",
  });

  // Carrega as categorias e reseta o formulário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setError("");
      setFormData({
        description: "",
        amount: "",
        transaction_date: new Date().toISOString().split("T")[0],
        type: "expense",
        category_id: "",
        is_recurring: false,
        recurrence_type: "installment",
        installment_total: 12,
        project_id: "",
      });
      fetchCategories();
      if (isBusiness) {
        fetchProjects();
      }
    }
  }, [isOpen, isBusiness]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const data = await categoryService.list(currentProfile);
      const list = Array.isArray(data) ? data : [];
      setCategories(list);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
      setError(err.message || "Falha ao carregar categorias.");
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);
      const data = await projectService.list("active");
      const list = Array.isArray(data) ? data : (data?.projects || []);
      setProjects(list);
    } catch (err) {
      console.error("Erro ao carregar projetos:", err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Garante que o select aponte para uma categoria válida do tipo ativo
  useEffect(() => {
    const validCats = categories.filter((c) => c.type === formData.type);
    if (validCats.length > 0) {
      const isCurrentValid = validCats.some((c) => c.id === formData.category_id);
      if (!isCurrentValid) {
        setFormData((prev) => ({ ...prev, category_id: validCats[0].id }));
      }
    } else {
      setFormData((prev) => ({ ...prev, category_id: "" }));
    }
  }, [categories, formData.type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.description.trim() || !formData.amount || !formData.category_id) {
      setError("Preencha todos os campos obrigatórios (incluindo a categoria).");
      return;
    }

    if (
      formData.is_recurring &&
      formData.recurrence_type === "installment" &&
      (!formData.installment_total || parseInt(formData.installment_total, 10) < 2)
    ) {
      setError("Para compras parceladas, o número mínimo de parcelas é 2.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        transaction_date: formData.transaction_date,
        type: formData.type,
        category_id: formData.category_id,
        type_recurrence: formData.is_recurring
          ? formData.recurrence_type
          : "unique",
        installment_total:
          formData.is_recurring && formData.recurrence_type === "installment"
            ? parseInt(formData.installment_total, 10)
            : null,
        profile_type: currentProfile,
        project_id: isBusiness && formData.project_id ? formData.project_id : null,
      };

      const response = await transactionService.create(payload);
      onSuccess(response);
      onClose();
    } catch (err) {
      setError(err.message || "Falha ao salvar lançamento.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 dark:bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200">
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Novo Lançamento</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Registre uma receita, despesa ou compra parcelada</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Formulário */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-950/60 ring-1 ring-accent-300 dark:ring-accent-800 text-accent-900 dark:text-accent-300 text-xs font-semibold flex items-center gap-2">
              <span className="text-accent-600 dark:text-accent-400 font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Lançamento */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
              <button
                type="button"
                onClick={() => handleTypeChange("income")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${formData.type === "income"
                  ? "bg-emerald-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Receita
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("expense")}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${formData.type === "expense"
                  ? "bg-rose-500 text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
              >
                Despesa
              </button>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Descrição *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Ex: Notebook Dell, Salário, Netflix"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>

            {/* Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {formData.is_recurring && formData.recurrence_type === "installment"
                    ? "Valor Total (R$) *"
                    : "Valor (R$) *"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {formData.is_recurring && formData.recurrence_type === "installment"
                    ? "Data 1ª Parcela *"
                    : "Data *"}
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Categoria *
              </label>
              <div className="relative">
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50"
                  required
                  disabled={loadingCategories || filteredCategories.length === 0}
                >
                  {filteredCategories.length === 0 ? (
                    <option value="" disabled>
                      {loadingCategories ? "Carregando categorias..." : "Nenhuma categoria disponível para este tipo"}
                    </option>
                  ) : (
                    <>
                      <option value="" disabled>
                        Selecione uma categoria
                      </option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {loadingCategories && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                  </div>
                )}
              </div>
              {filteredCategories.length === 0 && !loadingCategories && (
                <p className="text-xs text-accent-700 dark:text-accent-400 font-medium mt-1.5">
                  ⚠️ Nenhuma categoria de {formData.type === "income" ? "receita" : "despesa"} encontrada. Cadastre uma no menu <strong>Categorias</strong>.
                </p>
              )}
            </div>

            {/* Projeto (Apenas perfil Meu Negócio) */}
            {isBusiness && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Projeto / Obra (Opcional)
                </label>
                <div className="relative">
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all disabled:opacity-50"
                    disabled={loadingProjects}
                  >
                    <option value="">Nenhum projeto vinculado</option>
                    {projects.map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                  {loadingProjects && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Repetição / Parcelamento */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Tipo de Recorrência
                </label>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recurrence_type: "unique", is_recurring: false })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      formData.recurrence_type === "unique" || !formData.is_recurring
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    Única
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recurrence_type: "subscription", is_recurring: true })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      formData.is_recurring && formData.recurrence_type === "subscription"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    Fixa (Mensal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, recurrence_type: "installment", is_recurring: true })}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                      formData.is_recurring && formData.recurrence_type === "installment"
                        ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    Parcelada
                  </button>
                </div>
              </div>

              {formData.is_recurring && formData.recurrence_type === "installment" && (
                <div className="mt-4 p-4 rounded-xl bg-brand-50/60 dark:bg-slate-800/90 ring-1 ring-brand-200/70 dark:ring-slate-700 space-y-3.5 animate-fade-in-up">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-brand-900 dark:text-brand-300 uppercase tracking-wider mb-1">
                        Quantidade de Parcelas
                      </label>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {formData.amount && parseFloat(formData.amount) > 0 && formData.installment_total > 0
                          ? `Serão geradas ${formData.installment_total} parcelas de ${new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(parseFloat(formData.amount) / parseInt(formData.installment_total, 10))}`
                          : "Mínimo de 2 parcelas"}
                      </p>
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        name="installment_total"
                        min="2"
                        max="72"
                        value={formData.installment_total}
                        onChange={handleChange}
                        className="w-full px-3 py-1.5 text-center font-bold text-sm rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white ring-1 ring-brand-300 dark:ring-slate-600 focus:ring-2 focus:ring-brand-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.is_recurring && formData.recurrence_type === "subscription" && (
                <p className="mt-3 text-[11px] text-brand-700 dark:text-brand-300 bg-white/70 dark:bg-slate-700/60 p-2.5 rounded-lg border border-brand-100 dark:border-slate-600">
                  ℹ️ A despesa será replicada para os próximos 12 meses automaticamente.
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer do Modal */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            form="transaction-form"
            type="submit"
            disabled={saving || (filteredCategories.length === 0 && !loadingCategories)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {formData.is_recurring && formData.recurrence_type === "installment"
              ? `Gerar ${formData.installment_total || 2} Parcelas`
              : "Salvar Lançamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
