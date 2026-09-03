// web/src/pages/Categories.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Tags,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  X,
  Loader2,
} from "lucide-react";
import { categoryService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#14B8A6", // Teal
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#64748B", // Slate
];

export default function Categories() {
  const { logout } = useAuth();
  const { currentProfile } = useProfile();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for creating
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("income");
  const [newColor, setNewColor] = useState("#3B82F6");

  // Editing state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3B82F6");

  // Deleting state (Confirmation Modal)
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Alerts / Feedback
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);

  // Carrega categorias com tratamento de token JWT
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setErrorAlert(null);
      const data = await categoryService.list(currentProfile);
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao carregar categorias.");
      }
    } finally {
      setLoading(false);
    }
  }, [logout, currentProfile]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Criar categoria
  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    // Payload padronizado para a API REST
    const payload = {
      name: newName.trim(),
      type: newType.toLowerCase(),
      color: newColor,
      profile_type: currentProfile,
    };

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await categoryService.create(payload);

      setNewName("");
      setSuccessAlert("Categoria criada com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadCategories();
    } catch (err) {
      console.error("❌ Erro ao criar categoria no backend:", {
        message: err.message,
        status: err.status,
        code: err.code,
        details: err.details,
        rawError: err,
      });

      if (err.status === 401) {
        logout();
      } else {
        const errorMsg =
          err.details ||
          err.message ||
          "Erro ao criar categoria. Verifique os dados.";
        setErrorAlert(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Iniciar edição
  function startEdit(cat) {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditColor(cat.color || "#3B82F6");
    setErrorAlert(null);
  }

  // Salvar edição
  async function handleUpdate(e) {
    e.preventDefault();
    if (!editName.trim() || !editingCategory) return;

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await categoryService.update(editingCategory.id, {
        name: editName.trim(),
        color: editColor,
      });

      setEditingCategory(null);
      setSuccessAlert("Categoria atualizada com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadCategories();
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao atualizar categoria.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Confirmar e executar exclusão
  async function handleDelete() {
    if (!categoryToDelete) return;

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await categoryService.delete(categoryToDelete.id);

      setCategoryToDelete(null);
      setSuccessAlert("Categoria excluída com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadCategories();
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao excluir categoria.");
        setCategoryToDelete(null);
      }
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Tags className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Gerenciamento de Categorias
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Organize suas receitas e despesas com categorias personalizadas
          </p>
        </div>
      </div>

      {/* ── Alertas Globais ────────────────────────────────────────── */}
      {/* Alerta de Risco / Erro (Amarelo / Accent) */}
      {errorAlert && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-50 dark:bg-accent-950/60 border border-accent-300 dark:border-accent-800 text-accent-900 dark:text-accent-300 shadow-sm animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-accent-600 dark:text-accent-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-semibold text-accent-800 dark:text-accent-300">Atenção</p>
            <p className="text-accent-700 dark:text-accent-400 mt-0.5">{errorAlert}</p>
          </div>
          <button
            onClick={() => setErrorAlert(null)}
            className="text-accent-600 hover:text-accent-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Alerta de Sucesso */}
      {successAlert && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium flex-1">{successAlert}</p>
          <button
            onClick={() => setSuccessAlert(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Formulário de Adicionar Categoria (Topo) ────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          Nova Categoria
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Nome da Categoria */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Nome da Categoria
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Alimentação, Salário, Investimentos..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Tipo (Receita / Despesa) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setNewType("income")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  newType === "income"
                    ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Receita
              </button>
              <button
                type="button"
                onClick={() => setNewType("expense")}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  newType === "expense"
                    ? "bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-300 shadow-sm font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                Despesa
              </button>
            </div>
          </div>

          {/* Cores pré-definidas */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Cor
            </label>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {PRESET_COLORS.slice(0, 5).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                    newColor === color
                      ? "ring-2 ring-offset-2 ring-brand-600 scale-110"
                      : "opacity-80 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Botão Primário Azul de Adicionar */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={actionLoading || !newName.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Adicionar
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── Tabela / Lista de Categorias ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Categorias Cadastradas
          </h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {categories.length} {categories.length === 1 ? "categoria" : "categorias"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
            <p className="text-sm">Carregando categorias...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Tags className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Nenhuma categoria cadastrada</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Utilize o formulário acima para cadastrar sua primeira categoria de receitas ou despesas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Identificação</th>
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6">Data de Criação</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Nome + Bolinha da Cor */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: cat.color || "#3B82F6" }}
                        />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    {/* Tipo (Badge) */}
                    <td className="py-4 px-6">
                      {cat.type === "income" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Receita
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                          <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Despesa
                        </span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(cat.created_at).toLocaleDateString("pt-BR")}
                    </td>

                    {/* Ações (Editar / Excluir) */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botão Editar */}
                        <button
                          onClick={() => startEdit(cat)}
                          title="Editar Categoria"
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Botão Excluir */}
                        <button
                          onClick={() => {
                            setCategoryToDelete(cat);
                            setErrorAlert(null);
                          }}
                          title="Excluir Categoria"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de Edição ────────────────────────────────────────── */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                Editar Categoria
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Cor da Categoria
                </label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
                        editColor === color
                          ? "ring-2 ring-offset-2 ring-brand-600 scale-110"
                          : "opacity-75 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !editName.trim()}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação de Exclusão (ALERTA AMARELO / RISK) ── */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-accent-200 dark:border-accent-800/80 space-y-4">
            {/* Ícone de Risco Amarelo */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent-100 dark:bg-accent-950/70 border border-accent-300 dark:border-accent-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Excluir Categoria?
                </h3>
                <p className="text-xs font-semibold text-accent-700 dark:text-accent-400 uppercase tracking-wide mt-0.5">
                  Ação irreversível
                </p>
              </div>
            </div>

            {/* Mensagem e aviso de restrição relacional */}
            <div className="p-3.5 rounded-xl bg-accent-50/80 dark:bg-accent-950/50 border border-accent-200/80 dark:border-accent-800 text-xs text-accent-900 dark:text-accent-200 space-y-1">
              <p className="font-semibold">
                Tem certeza que deseja excluir a categoria{" "}
                <span className="underline font-bold text-slate-900 dark:text-white">
                  "{categoryToDelete.name}"
                </span>
                ?
              </p>
              <p className="text-accent-800 dark:text-accent-300 leading-relaxed">
                ⚠️ Se existirem lançamentos vinculados a esta categoria, o sistema não permitirá a exclusão para preservar o seu histórico financeiro.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={actionLoading}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sim, Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
