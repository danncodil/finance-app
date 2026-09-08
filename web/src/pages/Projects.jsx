// web/src/pages/Projects.jsx
import { useState, useEffect, useCallback } from "react";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  DollarSign,
  AlignLeft,
} from "lucide-react";
import { projectService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useProfile } from "../context/ProfileContext";

export default function Projects() {
  const { logout } = useAuth();
  const { isPersonal, toggleProfile } = useProfile();
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states for creating
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newStatus, setNewStatus] = useState("active");

  // Editing state
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // Deleting state (Confirmation Modal)
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Alerts / Feedback
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setErrorAlert(null);
      const data = await projectService.list();
      setProjects(Array.isArray(data) ? data : (data?.projects || []));
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao carregar projetos.");
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Only load projects if the user is on the business profile
    if (!isPersonal) {
      loadProjects();
    }
  }, [loadProjects, isPersonal]);

  // Se estiver no perfil Pessoal, mostramos um aviso de acesso bloqueado
  if (isPersonal) {
    return (
      <div className="px-4 py-16 max-w-6xl mx-auto flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-accent-100 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 flex items-center justify-center mb-2">
          <Briefcase className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Gestão de Projetos e Obras
        </h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-md">
          A gestão de projetos é exclusiva do perfil <strong>Meu Negócio</strong>. Alterne seu perfil para criar e gerenciar orçamentos de obras, consultorias e serviços da sua empresa.
        </p>
        <button
          onClick={toggleProfile}
          className="mt-4 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white font-bold shadow-md shadow-accent-500/20 transition-all cursor-pointer"
        >
          Alternar para Meu Negócio
        </button>
      </div>
    );
  }

  // Criar Projeto
  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    const payload = {
      name: newName.trim(),
      description: newDescription.trim() || null,
      budget: newBudget ? parseFloat(newBudget).toString() : null,
      status: newStatus,
    };

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await projectService.create(payload);

      setNewName("");
      setNewDescription("");
      setNewBudget("");
      setNewStatus("active");
      
      setSuccessAlert("Projeto criado com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadProjects();
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        const errorMsg = err.details || err.message || "Erro ao criar projeto.";
        setErrorAlert(typeof errorMsg === "string" ? errorMsg : JSON.stringify(errorMsg));
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Iniciar edição
  function startEdit(proj) {
    setEditingProject(proj);
    setEditName(proj.name);
    setEditDescription(proj.description || "");
    setEditBudget(proj.budget ? proj.budget.toString() : "");
    setEditStatus(proj.status || "active");
    setErrorAlert(null);
  }

  // Salvar edição
  async function handleUpdate(e) {
    e.preventDefault();
    if (!editName.trim() || !editingProject) return;

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await projectService.update(editingProject.id, {
        name: editName.trim(),
        description: editDescription.trim() || null,
        budget: editBudget ? parseFloat(editBudget).toString() : null,
        status: editStatus,
      });

      setEditingProject(null);
      setSuccessAlert("Projeto atualizado com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadProjects();
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao atualizar projeto.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  // Confirmar e executar exclusão
  async function handleDelete() {
    if (!projectToDelete) return;

    try {
      setActionLoading(true);
      setErrorAlert(null);
      await projectService.delete(projectToDelete.id);

      setProjectToDelete(null);
      setSuccessAlert("Projeto excluído com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
      await loadProjects();
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao excluir projeto.");
        setProjectToDelete(null);
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
            <Briefcase className="w-7 h-7 text-accent-600 dark:text-accent-400" />
            Gestão de Projetos e Obras
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle orçamentos, obras e contratos do seu negócio.
          </p>
        </div>
      </div>

      {/* ── Alertas Globais ────────────────────────────────────────── */}
      {errorAlert && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-300 shadow-sm animate-fade-in-up">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-semibold text-rose-800 dark:text-rose-300">Atenção</p>
            <p className="text-rose-700 dark:text-rose-400 mt-0.5">{errorAlert}</p>
          </div>
          <button onClick={() => setErrorAlert(null)} className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successAlert && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 shadow-sm animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-medium flex-1">{successAlert}</p>
          <button onClick={() => setSuccessAlert(null)} className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Formulário de Adicionar Projeto ────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-card border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-accent-600 dark:text-accent-400" />
          Novo Projeto
        </h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Nome da Obra / Projeto *
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ex: Reforma Casa 20"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
              />
            </div>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Orçamento (Opcional)
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all"
              />
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all cursor-pointer"
            >
              <option value="active">Em Andamento (Ativo)</option>
              <option value="completed">Concluído</option>
                    <option value="paused">Pausado</option>
                    <option value="cancelled">Cancelado</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={actionLoading || !newName.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold shadow-md shadow-accent-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Criar</>}
            </button>
          </div>
          
          <div className="md:col-span-12 space-y-1.5 mt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Descrição (Opcional)
            </label>
            <div className="relative">
              <AlignLeft className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                rows="1"
                placeholder="Detalhes adicionais do projeto..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all resize-y"
              />
            </div>
          </div>
        </form>
      </div>

      {/* ── Lista de Projetos ────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Meus Projetos</h2>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
            {projects.length} {projects.length === 1 ? "projeto" : "projetos"}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-accent-500" />
            <p className="text-sm">Carregando projetos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <Briefcase className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Nenhum projeto cadastrado</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Crie um novo projeto acima para começar a vincular suas despesas e receitas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Projeto</th>
                  <th className="py-3.5 px-6">Orçamento</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{proj.name}</span>
                        {proj.description && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[300px]">
                            {proj.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                      {proj.budget
                        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(proj.budget)
                        : <span className="text-xs text-slate-400 italic">Não definido</span>}
                    </td>
                    <td className="py-4 px-6">
                      {proj.status === "active" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          Em Andamento
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-200 dark:bg-slate-800/80 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          {{ completed: "Concluído", paused: "Pausado", cancelled: "Cancelado" }[proj.status] || proj.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(proj)} title="Editar" className="p-2 rounded-lg text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/50 transition-colors cursor-pointer">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setProjectToDelete(proj); setErrorAlert(null); }} title="Excluir" className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer">
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
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                Editar Projeto
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Nome do Projeto
                </label>
                <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  Descrição (Opcional)
                </label>
                <textarea rows="2" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 resize-y" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Orçamento
                  </label>
                  <input type="number" step="0.01" min="0" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Status
                  </label>
                  <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer">
                    <option value="active">Em Andamento</option>
                    <option value="completed">Concluído</option>
                    <option value="paused">Pausado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancelar</button>
                <button type="submit" disabled={actionLoading || !editName.trim()} className="px-5 py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold shadow-md shadow-accent-500/20 transition-all disabled:opacity-50 cursor-pointer">
                  {actionLoading ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Exclusão (ALERTA DE RISCO) ── */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-800/80 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Excluir Projeto?</h3>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wide mt-0.5">Ação irreversível</p>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <p className="font-semibold">
                Tem certeza que deseja excluir o projeto <span className="underline font-bold text-slate-900 dark:text-white">"{projectToDelete.name}"</span>?
              </p>
              <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
                As transações vinculadas serão preservadas, sem vínculo com este projeto.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setProjectToDelete(null)} disabled={actionLoading} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">Cancelar</button>
              <button type="button" onClick={handleDelete} disabled={actionLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Sim, Excluir</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
