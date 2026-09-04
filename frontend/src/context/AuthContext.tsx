import { createContext, useContext, useState, ReactNode } from "react";
import { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  });

  function login(token: string, newUser: AuthUser) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth يجب أن يُستعمل داخل AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "مسؤول النظام",
  REGIONAL_HEAD: "رئيس مصلحة التعلم عن بعد",
  PROVINCIAL_COORDINATOR: "منسق إقليمي",
  TEACHER: "أستاذ/ة",
  STUDENT: "تلميذ/ة",
};
