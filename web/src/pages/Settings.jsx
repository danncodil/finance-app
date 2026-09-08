// web/src/pages/Settings.jsx
import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { userService } from "../services/api";
import { transactionsCsv } from "../services/exportCsv";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { user: authUser, setUser: setAuthUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Feedback States (Toast Alerts)
  const [actionLoading, setActionLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setProfileLoading(true);
      setErrorAlert(null);
      const data = await userService.getProfile();
      setName(data.name || "");
      setEmail(data.email || "");
      setAuthUser(data);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao carregar perfil.");
      }
    } finally {
      setProfileLoading(false);
    }
  }

  // --- Handlers ---
  
  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setActionLoading(true);
      setErrorAlert(null);
      
      const updatedUser = await userService.updateProfile({ name: name.trim(), email: email.trim() });
      setAuthUser(updatedUser);
      
      setSuccessAlert("Perfil atualizado com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao atualizar perfil.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      setErrorAlert("As senhas não coincidem. Tente novamente.");
      return;
    }
    
    if (newPassword.length < 6) {
      setErrorAlert("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setActionLoading(true);
      setErrorAlert(null);
      
      await userService.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      setSuccessAlert("Senha alterada com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao alterar a senha. Verifique sua senha atual.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleExportData(format = 'csv') {
    try {
      setActionLoading(true);
      setErrorAlert(null);
      
      const data = await userService.exportData();
      
      if (format === 'csv' && (!data || !data.transactions || data.transactions.length === 0)) {
        setErrorAlert("Não existem lançamentos para exportar.");
        return;
      }
      
      const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : transactionsCsv(data)], {
        type: format === 'json' ? 'application/json;charset=utf-8;' : 'text/csv;charset=utf-8;'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_financeiro_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      
      setSuccessAlert("Download do backup iniciado com sucesso!");
      setTimeout(() => setSuccessAlert(null), 3500);
    } catch (err) {
      if (err.status === 401) {
        logout();
      } else {
        setErrorAlert(err.message || "Erro ao exportar dados.");
      }
    } finally {
      setActionLoading(false);
    }
  }

  // --- Render ---

  return (
    <div className="px-4 sm:px-8 py-6 max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* ── Cabeçalho ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <SettingsIcon className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            Configurações da Conta
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie seu perfil, segurança, tema e exportação de dados
          </p>
        </div>

        {/* Botão Rápido de Tema */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer w-fit"
        >
          {isDark ? <Sun className="w-4 h-4 text-accent-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
          <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
        </button>
      </div>

      {/* ── Alerta Global de Erro / Risco (Amarelo) ────────────────── */}
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

      {/* ── Alerta Global de Sucesso ───────────────────────────────── */}
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

      {/* ── Container com Abas Laterais ────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start mt-6">
        
        {/* Menu Lateral das Abas */}
        <div className="w-full md:w-64 flex flex-row md:flex-col gap-2 shrink-0 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => { setActiveTab("profile"); setErrorAlert(null); setSuccessAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "profile" 
                ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm font-semibold" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <User className="w-5 h-5" />
            Meu Perfil
          </button>
          
          <button
            onClick={() => { setActiveTab("security"); setErrorAlert(null); setSuccessAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "security" 
                ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm font-semibold" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Shield className="w-5 h-5" />
            Segurança
          </button>
          
          <button
            onClick={() => { setActiveTab("export"); setErrorAlert(null); setSuccessAlert(null); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "export" 
                ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 shadow-sm font-semibold" 
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Download className="w-5 h-5" />
            Exportar Dados
          </button>
        </div>

        {/* ── Área Principal da Aba ──────────────────────────────────── */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-card border border-slate-100 dark:border-slate-800 p-6 md:p-8 w-full min-h-[400px] transition-colors duration-200">
          
          {/* Aba: PERFIL */}
          {activeTab === "profile" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Informações Pessoais</h2>
              
              {profileLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      E-mail
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Aba: SEGURANÇA */}
          {activeTab === "security" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Alterar Senha</h2>
              
              <form onSubmit={handleUpdatePassword} className="space-y-5 max-w-md">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center justify-center px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Atualizar Senha"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Aba: EXPORTAR */}
          {activeTab === "export" && (
            <div className="animate-fade-in-up">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Exportar Backup</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 max-w-lg leading-relaxed">
                Exporte os lançamentos em CSV para planilhas ou baixe o backup completo em JSON com perfil, categorias, transações, projetos e metas.
              </p>
              
              {/* Botão Secundário Amarelo para Exportação */}
              <button
                type="button"
                onClick={() => handleExportData('csv')}
                disabled={actionLoading}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold shadow-md shadow-accent-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Baixar Backup (CSV)
                  </>
                )}
              </button>
              <button type="button" disabled={actionLoading} onClick={() => handleExportData('json')} className="mt-4 px-6 py-3 rounded-xl bg-brand-600 text-white text-sm font-bold disabled:opacity-50">
                Baixar Backup Completo (JSON)
              </button>
              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Privacidade dos Dados</span>
                O backup gerado contém informações financeiras sensíveis. Guarde o arquivo exportado em um local seguro.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
