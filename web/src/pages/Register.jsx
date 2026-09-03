// src/pages/Register.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // 1. Validação de Nome
    if (formData.name.trim().length < 3) {
      setErrorMessage("O nome completo deve ter no mínimo 3 caracteres.");
      return;
    }

    // 2. Validação de E-mail simples
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage("Por favor, insira um endereço de e-mail válido.");
      return;
    }

    // 3. Validação de Senha
    if (formData.password.length < 6) {
      setErrorMessage("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    // 4. Confirmação de Senha
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("As senhas informadas não coincidem. Verifique a digitação.");
      return;
    }

    try {
      setLoading(true);
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      // Redireciona para o Dashboard autenticado
      navigate("/", { replace: true });
    } catch (err) {
      if (err.status === 409) {
        setErrorMessage("Este e-mail já está cadastrado em nossa base. Faça login ou use outro e-mail.");
      } else {
        setErrorMessage(err.message || "Ocorreu um erro ao criar sua conta. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 overflow-hidden px-4 py-12 sm:px-6 lg:px-8">
      {/* ── Orbs de Fundo (Nave Espacial) ────────────────────────────────────────── */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/20 rounded-full mix-blend-screen filter blur-[150px] opacity-70 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full mix-blend-screen filter blur-[150px] opacity-70 pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in-up z-10">
        {/* ── Logo e Cabeçalho ────────────────────────────────────────── */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <img src="/simbolo-trio.png" alt="Símbolo TRIO" className="w-14 h-14 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            <h1 className="text-3xl font-bold text-white tracking-widest leading-none mt-2">TRIO</h1>
          </div>
          <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">
            Criar Nova Conta
          </p>
        </div>

        {/* ── Card do Formulário (Glassmorphism) ────────────────────────── */}
        <div className="bg-slate-900/50 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
          {/* Alerta de Validação / Erro */}
          {errorMessage && (
            <div
              id="register-error-alert"
              className="
                mb-6 flex items-start gap-3 p-3.5 rounded-xl
                bg-rose-500/10 ring-1 ring-rose-500/20
                text-rose-400 animate-fade-in-up
              "
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">
                <strong className="font-semibold block mb-0.5 text-rose-300">Aviso de validação</strong>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Nome Completo */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  className="
                    block w-full pl-10 pr-3.5 py-3 rounded-xl
                    bg-slate-950/50 text-sm text-white placeholder:text-slate-500
                    ring-1 ring-white/10
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Campo E-mail */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu.email@exemplo.com"
                  className="
                    block w-full pl-10 pr-3.5 py-3 rounded-xl
                    bg-slate-950/50 text-sm text-white placeholder:text-slate-500
                    ring-1 ring-white/10
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="
                    block w-full pl-10 pr-10 py-3 rounded-xl
                    bg-slate-950/50 text-sm text-white placeholder:text-slate-500
                    ring-1 ring-white/10
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                    absolute inset-y-0 right-0 pr-3 flex items-center
                    text-slate-500 hover:text-slate-300 cursor-pointer
                    transition-colors
                  "
                  aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repita a senha digitada"
                  className="
                    block w-full pl-10 pr-3.5 py-3 rounded-xl
                    bg-slate-950/50 text-sm text-white placeholder:text-slate-500
                    ring-1 ring-white/10
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Requisitos rápidos de segurança */}
            <div className="py-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    formData.password.length >= 6
                      ? "text-blue-400"
                      : "text-slate-600"
                  }`}
                />
                <span>Mínimo de 6 caracteres na senha</span>
              </div>
            </div>

            {/* Botão Criar Conta — Magnetic Blue */}
            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="
                flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl
                bg-blue-600 hover:bg-blue-500 active:scale-[0.98]
                text-white text-sm font-bold shadow-lg shadow-blue-500/30 ring-1 ring-blue-500/50
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                transition-all duration-200 cursor-pointer mt-2 uppercase tracking-widest
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Criando sua conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Conta e Começar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold">Ou cadastre-se com</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-slate-300 font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                  <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                  <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                  <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                </svg>
                <span>Google</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Link para Login ─────────────────────────────────────────── */}
        <p className="text-center text-sm text-slate-400 mt-6 font-medium">
          Já possui uma conta?{" "}
          <Link
            to="/login"
            className="font-bold text-blue-400 hover:text-blue-300 hover:underline transition-colors"
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
