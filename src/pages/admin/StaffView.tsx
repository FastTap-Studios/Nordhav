import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, UserCheck, UserX, Loader2, Shield, Clock } from "lucide-react";
import AdminDialog, { AdminInput, FieldLabel } from "../../components/admin/AdminDialog";
import { staffService } from "../../services/staff";
import { StaffMember } from "../../types";
import { useToast } from "../../components/admin/Toast";
import { useAuth } from "../../hooks/useAuth";

function formatLastLogin(iso?: string | null): string {
  if (!iso) return "Aldrig inloggad";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Okänt";
  return d.toLocaleString("sv-SE", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function LastLoginTooltip({
  member,
  x,
  y,
}: {
  member: StaffMember;
  x: number;
  y: number;
}) {
  return createPortal(
    <div
      role="tooltip"
      className="fixed z-[9999] pointer-events-none"
      style={{ left: x, top: y - 8, transform: "translate(-50%, -100%)" }}
    >
      <div className="rounded-lg border border-border/40 bg-popover text-popover-foreground shadow-lg px-3 py-2.5 min-w-[240px]">
        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
          <Clock className="w-3 h-3" />
          Senast inloggad
        </div>
        <p className="text-sm font-medium text-foreground">{formatLastLogin(member.lastLoginAt)}</p>
      </div>
    </div>,
    document.body
  );
}

export default function StaffView() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ email: "", fullName: "" });
  const [hoveredMember, setHoveredMember] = useState<StaffMember | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const showLastLoginTooltip = (member: StaffMember, row: HTMLTableRowElement) => {
    const rect = row.getBoundingClientRect();
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
    setHoveredMember(member);
  };

  const hideLastLoginTooltip = () => setHoveredMember(null);

  const load = async () => {
    setLoading(true);
    try {
      setStaff(await staffService.getAll());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const handleAdd = async () => {
    const email = form.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast("Ange en giltig e-postadress", "error");
      return;
    }
    setSaving(true);
    try {
      await staffService.add(
        { email, fullName: form.fullName.trim() || email.split("@")[0] },
        user?.email
      );
      await load();
      setDialogOpen(false);
      setForm({ email: "", fullName: "" });
      toast("Personal tillagd – admin-åtkomst aktiverad vid inloggning");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Kunde inte lägga till personal", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (member: StaffMember) => {
    if (member.email.toLowerCase() === user?.email?.toLowerCase() && member.isActive) {
      toast("Du kan inte inaktivera ditt eget konto här", "error");
      return;
    }
    try {
      await staffService.setActive(member.id, !member.isActive);
      await load();
      toast(member.isActive ? "Personal inaktiverad" : "Personal aktiverad");
    } catch {
      toast("Kunde inte uppdatera personal", "error");
    }
  };

  const handleRemove = async (member: StaffMember) => {
    if (member.email.toLowerCase() === user?.email?.toLowerCase()) {
      toast("Du kan inte ta bort ditt eget konto", "error");
      return;
    }
    if (!confirm(`Ta bort ${member.fullName || member.email} från personal?`)) return;
    try {
      await staffService.remove(member.id);
      await load();
      toast("Personal borttagen");
    } catch {
      toast("Kunde inte ta bort personal", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Personal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hantera vem som har admin-åtkomst till butiken
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Lägg till personal
        </button>
      </div>

      <div className="rounded-xl border bg-secondary/20 border-border/30 p-4 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Så fungerar det</p>
            <p className="mt-1">
              Lägg till personens e-postadress. När de skapar konto eller loggar in med samma adress
              får de automatiskt admin-åtkomst till panelen.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card border-border/30 overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <p className="p-16 text-center text-muted-foreground text-sm">Ingen personal registrerad.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-left">
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">NAMN</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">E-POST</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">ROLL</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider">STATUS</th>
                  <th className="p-4 font-mono text-xs text-muted-foreground tracking-wider hidden md:table-cell">
                    TILLAGD
                  </th>
                  <th className="p-4 w-24" />
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const isSelf = member.email.toLowerCase() === user?.email?.toLowerCase();
                  return (
                    <tr
                      key={member.id}
                      className="border-b border-border/20 hover:bg-muted/20"
                      onMouseEnter={(e) => showLastLoginTooltip(member, e.currentTarget)}
                      onMouseLeave={hideLastLoginTooltip}
                    >
                      <td className="p-4 font-medium">
                        {member.fullName}
                        {isSelf && (
                          <span className="ml-2 text-[10px] font-mono uppercase text-primary">Du</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-xs">{member.email}</td>
                      <td className="p-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                          Admin
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-mono uppercase px-2 py-0.5 rounded-md ${
                            member.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {member.isActive ? "Aktiv" : "Inaktiv"}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">
                        {new Date(member.createdAt).toLocaleDateString("sv-SE")}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleActive(member)}
                            disabled={isSelf && member.isActive}
                            className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-secondary transition-colors disabled:opacity-40"
                            aria-label={member.isActive ? "Inaktivera" : "Aktivera"}
                          >
                            {member.isActive ? (
                              <UserX className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(member)}
                            disabled={isSelf}
                            className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-secondary transition-colors disabled:opacity-40"
                            aria-label="Ta bort"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminDialog
        open={dialogOpen}
        title="Lägg till personal"
        onClose={() => setDialogOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !form.email.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Lägg till
            </button>
          </>
        }
      >
        <div className="space-y-4 pt-2">
          <div>
            <FieldLabel>E-post *</FieldLabel>
            <AdminInput
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="namn@foretag.se"
            />
          </div>
          <div>
            <FieldLabel>Namn</FieldLabel>
            <AdminInput
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="För- och efternamn"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Personen behöver registrera sig på /admin med samma e-postadress för att logga in.
          </p>
        </div>
      </AdminDialog>

      {hoveredMember && (
        <LastLoginTooltip member={hoveredMember} x={tooltipPos.x} y={tooltipPos.y} />
      )}
    </div>
  );
}
