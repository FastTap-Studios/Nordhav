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
  recoveryMode: boolean;
  supabaseEnabled: boolean;
  login: (email?: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
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
  const [recoveryMode, setRecoveryMode] = useState(() =>
    typeof window !== "undefined" && window.location.hash.includes("type=recovery")
  );

  useEffect(() => {
    const sb = getSupabaseSafe();
    if (!sb) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const syncFromSession = (session: Session | null) => {
      void (async () => {
        const mapped = mapUser(session?.user ?? null);
        if (!mounted) return;
        setUser(mapped);
        try {
          setIsAdmin(await resolveAdmin(mapped));
        } catch (err) {
          console.warn("[Auth] resolveAdmin failed:", err);
          setIsAdmin(mapped ? isStaffEmail(mapped.email) : false);
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    };

    // Defer Supabase calls to avoid auth client deadlock (getSession + onAuthStateChange).
    sb.auth
      .getSession()
      .then(({ data: { session } }) => {
        setTimeout(() => syncFromSession(session), 0);
      })
      .catch((err) => {
        console.warn("[Auth] getSession failed:", err);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
      if (event === "INITIAL_SESSION") return;
      setTimeout(() => syncFromSession(session), 0);
    });

    const safety = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 6000);

    return () => {
      mounted = false;
      window.clearTimeout(safety);
      subscription.unsubscribe();
    };
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

  const requestPasswordReset = async (email: string) => {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Supabase är inte konfigurerat." };

    const trimmed = email.trim();
    if (!trimmed) return { error: "Ange din e-postadress." };

    const { error } = await sb.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  };

  const updatePassword = async (password: string) => {
    const sb = getSupabaseSafe();
    if (!sb) return { error: "Supabase är inte konfigurerat." };

    const { error } = await sb.auth.updateUser({ password });
    if (error) return { error: error.message };

    setRecoveryMode(false);
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
    return {};
  };

  const logout = async () => {
    const sb = getSupabaseSafe();
    if (sb) {
      await sb.auth.signOut();
    }
    setUser(null);
    setIsAdmin(false);
    setRecoveryMode(false);
    localStorage.removeItem("fishing_mock_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        recoveryMode,
        supabaseEnabled: isSupabaseConfigured,
        login,
        signUp,
        requestPasswordReset,
        updatePassword,
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
