import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabaseSafe, isSupabaseConfigured } from "../lib/supabase";
import { isStaffEmail, staffService } from "../services/staff";

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  isAdmin: boolean;
  loading: boolean;
  supabaseEnabled: boolean;
  login: (email?: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(u: User | null): AppUser | null {
  if (!u || !u.email) return null;
  return {
    uid: u.id,
    email: u.email,
    displayName: u.user_metadata?.full_name || u.email.split("@")[0],
    emailVerified: !!u.email_confirmed_at,
  };
}

function mapMockUser(email: string): AppUser {
  return {
    uid: "mock-user-" + Math.random().toString(36).substring(7),
    email,
    displayName: email.split("@")[0],
    emailVerified: true,
  };
}

async function resolveAdmin(user: AppUser | null): Promise<boolean> {
  if (!user?.email) return false;
  if (!isSupabaseConfigured) return isStaffEmail(user.email);
  return staffService.resolveAdminAccess(user.uid, user.email);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (isSupabaseConfigured) return null;
    const saved = localStorage.getItem("fishing_mock_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    if (isSupabaseConfigured) return false;
    const saved = localStorage.getItem("fishing_mock_user");
    if (saved) return isStaffEmail(JSON.parse(saved)?.email);
    return false;
  });
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    const sb = getSupabaseSafe();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
      const mapped = mapUser(session?.user ?? null);
      setUser(mapped);
      setIsAdmin(await resolveAdmin(mapped));
      setLoading(false);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (_event, session) => {
      const mapped = mapUser(session?.user ?? null);
      setUser(mapped);
      setIsAdmin(await resolveAdmin(mapped));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email?: string, password?: string) => {
    const sb = getSupabaseSafe();

    if (!sb) {
      let targetEmail = email?.trim();
      if (!targetEmail) {
        try {
          const prompted = prompt(
            "Ange din e-postadress för att logga in:",
            "chia.jamal93@gmail.com"
          );
          if (prompted) targetEmail = prompted.trim();
        } catch {
          console.warn("Prompt blocked, using default email");
        }
      }
      targetEmail = targetEmail || "chia.jamal93@gmail.com";
      const mock = mapMockUser(targetEmail);
      setUser(mock);
      setIsAdmin(isStaffEmail(mock.email));
      localStorage.setItem("fishing_mock_user", JSON.stringify(mock));
      return {};
    }

    const trimmed = (email || "").trim();
    if (!password) {
      return { error: "Ange lösenord för Supabase-inloggning." };
    }

    const { error } = await sb.auth.signInWithPassword({ email: trimmed, password });
    if (error) return { error: error.message };
    return {};
  };

  const signUp = async (email: string, password: string) => {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Supabase är inte konfigurerat." };

    const { error } = await sb.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    const sb = getSupabaseSafe();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem("fishing_mock_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        supabaseEnabled: isSupabaseConfigured,
        login,
        signUp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
