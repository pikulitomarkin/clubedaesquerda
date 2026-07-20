"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  accessToken: string | null;
  userId: string | null;
  emailVerified: boolean;
  setSession: (accessToken: string, emailVerified: boolean) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Decodifica o payload do JWT sem verificar assinatura — só para exibir
// o próprio userId na UI (ex.: comparar com o alvo de um evento
// realtime). Nunca usar isso para decisões de autorização: a API é a
// única fonte de verdade, ela reverifica a assinatura em toda request.
function decodeUserId(accessToken: string): string | null {
  try {
    const segment = accessToken.split(".")[1];
    if (!segment) return null;
    const payload = JSON.parse(atob(segment));
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

// Access token vive só em memória (nunca em localStorage): perde-se ao
// recarregar a página, momento em que o app deve chamar POST /auth/refresh
// (cookie httpOnly do refresh token) para obter um novo — ver
// docs/contexto.md § "Autenticação".
export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);

  const setSession = useCallback((token: string, verified: boolean) => {
    setAccessToken(token);
    setUserId(decodeUserId(token));
    setEmailVerified(verified);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUserId(null);
    setEmailVerified(false);
  }, []);

  return (
    <AuthContext.Provider value={{ accessToken, userId, emailVerified, setSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
