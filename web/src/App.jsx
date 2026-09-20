// src/App.jsx
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { ProfileProvider } from "./context/ProfileContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import Sidebar from "./components/Sidebar";
import BottomNavigation from "./components/BottomNavigation";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Categories = lazy(() => import("./pages/Categories"));
const ReportsDashboard = lazy(() => import("./pages/ReportsDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Projects = lazy(() => import("./pages/Projects"));
const Goals = lazy(() => import("./pages/Goals"));
import ProfileToggle from "./components/ProfileToggle";
import TopHeader from "./components/TopHeader";
import AIAssistantModal from "./components/AIAssistantModal";
import CommandMenu from "./components/CommandMenu";
import { Search } from "lucide-react";

/**
 * Layout principal para as áreas autenticadas do sistema
 */
function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  return (
    <div className="trio-app flex flex-col md:flex-row h-screen overflow-hidden text-slate-900 dark:text-slate-100">
      {/* ── Top Navbar Mobile ────────────────────────── */}
      <header className="trio-mobile-header md:hidden flex items-center justify-between px-4 py-3 shrink-0 z-30 relative">
        {/* Lado Esquerdo: Símbolo e Nome */}
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1c211a]"><img src={`${import.meta.env.BASE_URL}simbolo-trio.png`} alt="" className="size-6 object-contain" /></span>
          <div className="flex flex-col justify-center">
            <span className="text-xl font-bold text-[#1c211a] dark:text-white tracking-[-.07em] leading-none" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              trio<span className="text-[#8dbd3c]">.</span>
            </span>
          </div>
        </div>

        {/* Lado Direito: Perfil (Sem Menu) */}
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => window.dispatchEvent(new Event("trio:open-command"))} aria-label="Buscar páginas" className="trio-mobile-search grid size-10 place-items-center rounded-full"><Search size={19} /></button>
          <div className="scale-[0.75] origin-right -mr-6">
            <ProfileToggle />
          </div>
        </div>
      </header>

      {/* Menu lateral fixo (Apenas Desktop) */}
      <Sidebar />

      {/* Conteúdo principal com scroll */}
      {/* Adicionado pb-20 no mobile para o conteúdo não ficar embaixo da Bottom Navigation */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden relative pb-[72px] md:pb-0">
        {/* Orbs de luz no fundo para realçar o Glassmorphism */}
        {/* Header Desktop (para o Toggle e Perfil) */}
        <TopHeader />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}><motion.div key={location.pathname} className="min-h-full" initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .22, ease: "easeOut" }}>
          <Suspense fallback={<div className="p-8 text-sm text-slate-500" role="status">Carregando página...</div>}><Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/reports" element={<ReportsDashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
          </motion.div></AnimatePresence>
        </div>
        
        {/* Floating AI Assistant Button & Modal */}
        <AIAssistantModal />
        <CommandMenu />
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
          <Suspense fallback={<div className="min-h-screen grid place-items-center text-sm text-slate-500" role="status">Carregando página...</div>}><Routes>
            {/* Rotas públicas de autenticação */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Rotas privadas autenticadas */}
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<AppLayout />} />
            </Route>
          </Routes></Suspense>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
