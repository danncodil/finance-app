import { createContext, useContext, useState, useEffect } from "react";

const ProfileContext = createContext({});

const PROFILE_KEY = "@finance_app:profile";

export function ProfileProvider({ children }) {
  // Inicializa o perfil com o valor do localStorage ou 'personal' como padrão
  const [currentProfile, setCurrentProfile] = useState(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    return saved === "business" ? "business" : "personal";
  });

  // Salva no localStorage sempre que o perfil mudar
  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, currentProfile);
  }, [currentProfile]);

  const toggleProfile = () => {
    setCurrentProfile((prev) => (prev === "personal" ? "business" : "personal"));
  };

  const isBusiness = currentProfile === "business";
  const isPersonal = currentProfile === "personal";

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        setCurrentProfile,
        toggleProfile,
        isBusiness,
        isPersonal,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
