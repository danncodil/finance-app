import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { User, LogOut, ChevronDown, Check, Camera, Settings, Sun, Moon, Search } from "lucide-react";
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
    <header className="hidden md:flex items-center justify-between px-7 py-4 border-b border-white/[.08] bg-[#101010]/80 backdrop-blur-xl z-40 w-full relative">
      <button onClick={() => window.dispatchEvent(new Event("trio:command"))} className="flex w-[250px] items-center gap-3 rounded-2xl border border-white/[.09] bg-white/[.045] px-3.5 py-2.5 text-left text-sm text-[#c9c9c6] transition hover:bg-white/[.08]"><Search className="h-4 w-4 text-brand-400" /><span className="flex-1">Buscar página</span><kbd className="rounded-md border border-white/[.13] px-1.5 py-0.5 text-[10px] text-[#a6a6a3]">Ctrl K</kbd></button>
      <div className="flex items-center justify-center shrink-0 absolute left-1/2 -translate-x-1/2">
        <ProfileToggle />
      </div>

      {/* Elementos à Direita */}
      <div className="flex-1 flex justify-end">
        <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-white/[.06] transition-colors cursor-pointer border border-transparent hover:border-white/[.1]"
        >
          <div className="w-9 h-9 rounded-full bg-brand-400 flex items-center justify-center text-[#111111] font-bold overflow-hidden border-2 border-[#292929] shadow-sm">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />
            )}
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-[#f2f2ef] leading-none">
              {user.name || "Usuário"}
            </p>
            <p className="text-[11px] text-[#9c9c99] mt-1 leading-none">
              Minha Conta
            </p>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#9c9c99] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-[340px] bg-[#151515] rounded-[26px] shadow-[0_24px_70px_rgba(0,0,0,.48)] border border-white/[.12] overflow-hidden z-50 trio-enter">
            <div className="p-5 border-b border-white/[.08] bg-[radial-gradient(circle_at_80%_0%,rgba(255,255,255,.09),transparent_32%)]">
              <div className="flex items-center gap-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-[#f3f3ef] text-[#111] grid place-items-center font-bold">{user.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover grayscale" /> : user.name?.charAt(0).toUpperCase()}</div><div className="min-w-0"><p className="text-sm font-bold text-white truncate">
                {user.name || "Usuário"}
              </p><p className="text-xs text-[#989894] truncate mt-0.5">
                {user.email}
              </p></div></div>
            </div>

            <div className="p-5">
              <p className="trio-kicker text-[#a8a8a5] mb-3">
                Escolha seu Avatar
              </p>
              <div className="grid grid-cols-5 gap-2.5">
                {/* Botão de Upload Customizado */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer transition-transform hover:scale-105 bg-[#202020] flex items-center justify-center text-[#a6a6a3] hover:text-white border border-dashed border-white/[.2] ring-1 ring-transparent hover:ring-white/60"
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
                      transition-transform hover:scale-105 grayscale hover:grayscale-0
                      ${user.avatar === avatar.url ? 'ring-2 ring-white ring-offset-2 ring-offset-[#151515]' : 'ring-1 ring-white/[.12]'}
                    `}
                  >
                    <img src={avatar.url} alt={`Avatar ${avatar.id}`} className="w-full h-full object-cover bg-[#202020]" />
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
            <div className="m-3 mt-0 rounded-2xl border border-white/[.08] bg-white/[.035] p-1.5">
              <button
                onClick={() => {
                  toggleTheme();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#d5d5d2] hover:bg-white/[.08] transition-colors cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-white" />
                ) : (
                  <Moon className="w-4 h-4 text-white" />
                )}
                {isDark ? "Modo Claro" : "Modo Escuro"}
              </button>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  navigate("/settings");
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#d5d5d2] hover:bg-white/[.08] transition-colors cursor-pointer mt-0.5"
              >
                <Settings className="w-4 h-4 text-[#c4c4c1]" />
                Configurações
              </button>
            </div>

            <div className="px-3 pb-3">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-400/10 transition-colors cursor-pointer"
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
