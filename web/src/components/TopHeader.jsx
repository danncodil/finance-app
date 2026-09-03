import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, LogOut, ChevronDown, Check, Camera, Settings, Sun, Moon } from "lucide-react";
import ProfileToggle from "./ProfileToggle";

// Usando robozinhos estilosos do Dicebear como padrão abstrato
const PREDEFINED_AVATARS = [
  { id: "bot-purple", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=a855f7" },
  { id: "bot-emerald", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka&backgroundColor=10b981" },
  { id: "bot-blue", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Jack&backgroundColor=3b82f6" },
  { id: "bot-orange", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Jude&backgroundColor=f59e0b" },
];

export default function TopHeader() {
  const { user, logout, updateAvatar } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_SIZE = 128;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        handleSelectAvatar(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectAvatar = (url) => {
    updateAvatar(url);
    setIsDropdownOpen(false);
  };

  if (!user) return null;

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-3 border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm z-40 w-full relative">
      {/* Spacer esquerdo para centralização perfeita */}
      <div className="flex-1" />

      {/* Elemento Centralizado */}
      <div className="flex items-center justify-center shrink-0">
        <ProfileToggle />
      </div>

      {/* Elementos à Direita */}
      <div className="flex-1 flex justify-end">
        <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
        >
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />
            )}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-none">
              {user.name || "Usuário"}
            </p>
            <p className="text-[11px] text-slate-500 mt-1 leading-none">
              Minha Conta
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {user.name || "Usuário"}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.email}
              </p>
            </div>

            <div className="p-4">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Escolha seu Avatar
              </p>
              <div className="grid grid-cols-5 gap-2">
                {/* Botão de Upload Customizado */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 border border-dashed border-slate-300 dark:border-slate-600 ring-1 ring-transparent hover:ring-blue-500/50"
                  title="Enviar sua foto"
                >
                  <Camera className="w-5 h-5" />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </button>

                {/* Avatares Predefinidos */}
                {PREDEFINED_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar.url)}
                    className={`
                      relative w-full aspect-square rounded-xl overflow-hidden cursor-pointer
                      transition-transform hover:scale-105 hover:shadow-md
                      ${user.avatar === avatar.url ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900' : 'ring-1 ring-slate-200 dark:ring-slate-700'}
                    `}
                  >
                    <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover bg-slate-100 dark:bg-slate-800" />
                    {user.avatar === avatar.url && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ações (Tema e Configurações) */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500 drop-shadow-sm" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-500" />
                )}
                {isDark ? "Modo Claro" : "Modo Escuro"}
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/settings");
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer mt-0.5"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Configurações
              </button>
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
