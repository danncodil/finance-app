// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ProfileProvider } from "./context/ProfileContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Sidebar from "./components/Sidebar";
import BottomNavigation from "./components/BottomNavigation";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

import Categories from "./pages/Categories";
import ReportsDashboard from "./pages/ReportsDashboard";
import Settings from "./pages/Settings";
import Transactions from "./pages/Transactions";
import Projects from "./pages/Projects";
import Goals from "./pages/Goals";
import ProfileToggle from "./components/ProfileToggle";
import TopHeader from "./components/TopHeader";
import AIAssistantModal from "./components/AIAssistantModal";
import { Wallet, Sun, Moon } from "lucide-react";

/**
 * Layout principal para as áreas autenticadas do sistema
 */
function AppLayout() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ── Top Navbar Mobile ────────────────────────── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 shrink-0 z-30 shadow-sm relative">
        {/* Lado Esquerdo: Símbolo e Nome */}
        <div className="flex items-center gap-2">
          <img src="/simbolo-trio.png" alt="Símbolo TRIO" className="w-7 h-7 shrink-0 object-contain drop-shadow-md" />
          <div className="flex flex-col justify-center">
            <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 tracking-[0.2em] leading-none drop-shadow-sm pb-0.5">
              TRIO
            </span>
          </div>
        </div>

        {/* Lado Direito: Perfil (Sem Menu) */}
        <div className="flex items-center gap-1">
          <div className="scale-[0.8] origin-right">
            <ProfileToggle />
          </div>
        </div>
      </header>

      {/* Menu lateral fixo (Apenas Desktop) */}
      <Sidebar />

      {/* Conteúdo principal com scroll */}
      {/* Adicionado pb-20 no mobile para o conteúdo não ficar embaixo da Bottom Navigation */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200 relative pb-[68px] md:pb-0">
        {/* Orbs de luz no fundo para realçar o Glassmorphism */}
        <div className="hidden dark:block absolute top-0 left-1/4 w-96 h-96 bg-brand-600/10 rounded-full mix-blend-screen filter blur-[128px] opacity-70 pointer-events-none" />
        <div className="hidden dark:block absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full mix-blend-screen filter blur-[128px] opacity-70 pointer-events-none" />
        {/* Header Desktop (para o Toggle e Perfil) */}
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/reports" element={<ReportsDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        {/* Floating AI Assistant Button & Modal */}
        <AIAssistantModal />
      </main>

      {/* Barra de Navegação Inferior (Mobile) */}
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <Routes>
            {/* Rotas públicas de autenticação */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas privadas autenticadas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<AppLayout />} />
            </Route>
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
