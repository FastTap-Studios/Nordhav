import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Loader2 } from "lucide-react";

interface AdminResetPasswordProps {
  supabaseEnabled: boolean;
  onUpdatePassword: (password: string) => Promise<{ error?: string }>;
}

export default function AdminResetPassword({
  supabaseEnabled,
  onUpdatePassword,
}: AdminResetPasswordProps) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");

    if (!supabaseEnabled) {
      setError("Lösenordsåterställning kräver Supabase.");
      return;
    }
    if (password.length < 6) {
      setError("Lösenord måste vara minst 6 tecken.");
      return;
    }
    if (password !== confirm) {
      setError("Lösenorden matchar inte.");
      return;
    }

    setLoading(true);
    try {
      const result = await onUpdatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        setInfo("Lösenordet är uppdaterat. Du kan nu logga in.");
        setTimeout(() => navigate("/admin", { replace: true }), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-shell min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-card p-10 sm:p-12 rounded-xl shadow-lg border border-border/30 text-center max-w-md w-full">
        <div className="bg-primary/10 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
          <KeyRound className="h-8 w-8 text-primary" />
        </div>

        <h1 className="text-2xl font-display font-bold mb-1">Nytt lösenord</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Välj ett nytt lösenord för ditt admin-konto.
        </p>

        <div className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Nytt lösenord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minst 6 tecken"
              className="w-full bg-muted border border-border/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider mb-2">
              Bekräfta lösenord
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Upprepa lösenordet"
              className="w-full bg-muted border border-border/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {info && <p className="text-sm text-emerald-600">{info}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-mono text-xs uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Spara nytt lösenord
          </button>
        </div>

        <Link
          to="/admin"
          className="inline-block mt-8 text-xs font-mono text-muted-foreground hover:text-primary uppercase tracking-wider"
        >
          ← Tillbaka till inloggning
        </Link>
      </div>
    </div>
  );
}
