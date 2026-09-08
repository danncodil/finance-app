// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService, userService } from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const expire = () => { setToken(null); setUser(null); };
    const refreshed = () => setToken(localStorage.getItem('access_token'));
    window.addEventListener('auth-expired', expire);
    window.addEventListener('auth-refreshed', refreshed);
    // Busca a sessão inicial do localStorage
    const savedToken = localStorage.getItem('access_token');

    if (savedToken) {
      setToken(savedToken);
      fetchUserProfile();
    } else {
      setLoading(false);
    }
    return () => {
      window.removeEventListener('auth-expired', expire);
      window.removeEventListener('auth-refreshed', refreshed);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const profileData = await userService.getProfile();
      setUser(profileData);
    } catch (err) {
      console.error("Falha ao carregar perfil:", err);
      // Se deu erro ao buscar o perfil (ex: token inválido sem refresh), limpa a sessão
      if (err.status === 401 || err.status === 403) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setToken(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });

    // Salva os tokens no localStorage
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    setToken(data.access_token);
    setUser(data.user);

    return data;
  };

  const register = async ({ name, email, password }) => {
    const data = await authService.register({ name, email, password });

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    setToken(data.access_token);
    setUser(data.user);

    return data;
  };

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setToken(null);
  }, []);

  const updateAvatar = async (avatarUrl) => {
    const updatedUser = { ...user, avatar: avatarUrl };
    setUser(updatedUser);
    await userService.updateProfile({ avatar: avatarUrl });
  };

  const value = {
    user,
    setUser,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
