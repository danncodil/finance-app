// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabase";
import { authService, userService } from "../services/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuta mudanças de autenticação (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser) => {
    try {
      const profileData = await userService.getProfile();
      setUser({ ...authUser, ...profileData });
    } catch (err) {
      console.error("Falha ao carregar perfil:", err);
      // Fallback
      setUser(authUser);
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    return data;
  };

  const register = async ({ name, email, password }) => {
    const data = await authService.register({ name, email, password });
    return data;
  };

  const loginWithGoogle = async () => {
    await authService.loginWithGoogle();
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setSession(null);
  };

  const updateAvatar = async (avatarUrl) => {
    const updatedUser = { ...user, avatar: avatarUrl };
    setUser(updatedUser);
    await userService.updateProfile({ avatar: avatarUrl });
  };

  const value = {
    user,
    setUser,
    token: session?.access_token,
    loading,
    isAuthenticated: !!session,
    login,
    loginWithGoogle,
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
