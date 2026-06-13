import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, Loader2 } from "lucide-react";

interface AdminLoginProps {
  supabaseEnabled: boolean;
  onLogin: (email: string, password?: string) => Promise<{ error?: string }>;
  onSignUp: (email: string, password: string) => Promise<{ error?: string }>;
}

export default function AdminLogin({ supabaseEnabled, onLogin, onSignUp }: AdminLoginProps) {
  const [email, setEmail] = useState("chia.jamal93@gmail.com");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (supabaseEnabled) {
        if (password.length < 6) {
          setError("Lösenord måste vara minst 6 tecken.");
          return;
        }
        const result =
          mode === "login" ? await onLogin(email, password) : await onSignUp(email, password);
        if (result.error) {
          setError(result.error);
        } else if (mode === "signup") {
          setInfo("Konto skapat! Kontrollera e-post för verifiering, logga sedan in.");
          setMode("login");
        }
      } else {
        const result = await onLogin(email);
        if (result.error) setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-card p-10 sm:p-12 rounded-xl shadow-lg border border-border/30 text-center max-w-md w-full">
        <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Package className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-display font-bold mb-1">Administration</h1>
        <p className="text-sm text-muted-foreground mb-2">
          Logga in för att hantera produkter, ordrar och butiksinställningar.
        </p>
        {supabaseEnabled && (
          <p className="text-[10px] font-mono text-primary mb-6 uppercase tracking-wider">
            Supabase ansluten
          </p>
        )}

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Admin-e-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-muted border border-border/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {supabaseEnabled && (
            <div>
              <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minst 6 tecken"
                className="w-full bg-muted border border-border/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {supabaseEnabled ? (mode === "login" ? "Logga in" : "Skapa konto") : "Logga in"}
          </button>

          {supabaseEnabled ? (
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
                setInfo("");
              }}
              className="w-full text-xs font-mono text-muted-foreground hover:text-primary uppercase tracking-wider"
            >
              {mode === "login" ? "Skapa nytt admin-konto →" : "← Tillbaka till inloggning"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onLogin("chia.jamal93@gmail.com")}
              className="w-full bg-secondary text-secondary-foreground py-2.5 rounded-lg font-mono text-[10px] uppercase tracking-wider hover:bg-secondary/80 transition-colors"
            >
              Snabbinloggning (Chia Admin)
            </button>
          )}
        </div>

        <Link
          to="/"
          className="inline-block mt-8 text-xs font-mono text-muted-foreground hover:text-primary uppercase tracking-wider"
        >
          ← Tillbaka till butiken
        </Link>
      </div>
    </div>
  );
}
