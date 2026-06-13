import { useRef, useState } from "react";
import {
  Upload,
  Download,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  X,
  Loader2,
} from "lucide-react";
import {
  CSV_FIELDS,
  CsvFieldKey,
  ParsedCsvRow,
  autoDetectColumnMap,
  downloadCsvTemplate,
  isValidImportRow,
  parseCsvText,
  rowToProduct,
} from "./csvUtils";

type Step = "upload" | "map" | "preview" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "upload", label: "Ladda upp" },
  { id: "map", label: "Kolumnmappning" },
  { id: "preview", label: "Förhandsgranska" },
];

interface ProductCsvImportProps {
  open: boolean;
  onClose: () => void;
  onImport: (rows: ParsedCsvRow[]) => Promise<{ ok: number; failed: number }>;
}

export default function ProductCsvImport({ open, onClose, onImport }: ProductCsvImportProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [columnMap, setColumnMap] = useState<Partial<Record<CsvFieldKey, number>>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState({ ok: 0, failed: 0 });

  const parsedRows = rawRows.map((row) => rowToProduct(row, columnMap));
  const validRows = parsedRows.filter(isValidImportRow);
  const invalidCount = parsedRows.length - validRows.length;

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRawRows([]);
    setColumnMap({});
    setResult({ ok: 0, failed: 0 });
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    try {
      const text = await file.text();
      const { headers: h, rows } = parseCsvText(text);
      if (!h.length || !rows.length) return;
      setHeaders(h);
      setRawRows(rows);
      setColumnMap(autoDetectColumnMap(h));
      setStep("map");
    } catch {
      alert("Kunde inte läsa filen — kontrollera att det är en giltig CSV.");
    }
  };

  const runImport = async () => {
    setImporting(true);
    try {
      const res = await onImport(validRows);
      setResult(res);
      setStep("done");
    } finally {
      setImporting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/80" aria-label="Stäng" onClick={handleClose} />
      <div className="relative bg-card border border-border/30 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border/30 px-6 py-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-display font-bold">Importera Produkter via CSV</h2>
            </div>
            {step !== "done" && (
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground pt-2">
                {STEPS.map((s, i) => (
                  <span key={s.id} className="flex items-center gap-2">
                    <span
                      className={
                        step === s.id
                          ? "text-primary font-bold"
                          : STEPS.findIndex((x) => x.id === step) > i
                            ? "text-foreground"
                            : ""
                      }
                    >
                      {s.label}
                    </span>
                    {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 opacity-40" />}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button type="button" onClick={handleClose} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "upload" && (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer bg-muted/20"
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium">Dra och släpp CSV-fil här</p>
                  <p className="text-sm text-muted-foreground mt-1">eller klicka för att välja fil</p>
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />

              <div>
                <p className="text-xs text-muted-foreground mb-2">Förväntade kolumner:</p>
                <div className="flex flex-wrap gap-2">
                  {CSV_FIELDS.map((f) => (
                    <span
                      key={f.key}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        f.required ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-muted/50"
                      }`}
                    >
                      {f.label}
                      {f.required && " *"}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Ladda ner mall
                </button>
              </div>
            </div>
          )}

          {step === "map" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {rawRows.length} rader hittades i filen. Kontrollera att kolumnerna är rätt mappade.
                </p>
                <button type="button" onClick={reset} className="p-2 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {CSV_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-2">
                    <div className="w-32 shrink-0">
                      <p className="text-xs font-medium truncate">
                        {field.label}
                        {field.required && <span className="text-primary"> *</span>}
                      </p>
                    </div>
                    <select
                      value={columnMap[field.key] !== undefined ? String(columnMap[field.key]) : ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setColumnMap((prev) => {
                          const next = { ...prev };
                          if (val === "") delete next[field.key];
                          else next[field.key] = Number(val);
                          return next;
                        });
                      }}
                      className="flex-1 min-w-0 bg-muted border border-border/30 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— Hoppa över —</option>
                      {headers.map((h, i) => (
                        <option key={i} value={String(i)}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={reset}
                  className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
                >
                  Tillbaka
                </button>
                <button
                  type="button"
                  onClick={() => setStep("preview")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  Förhandsgranska
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-mono px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {validRows.length} giltiga
                </span>
                {invalidCount > 0 && (
                  <span className="text-xs font-mono px-2 py-1 rounded-md bg-red-50 text-red-700 border border-red-200">
                    {invalidCount} ogiltiga
                  </span>
                )}
              </div>

              <div className="border border-border/30 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      {["", "Namn", "Pris", "Kategori", "Lager"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wider text-muted-foreground">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, i) => {
                      const ok = isValidImportRow(row);
                      return (
                        <tr key={i} className={`border-t border-border/20 ${ok ? "" : "opacity-40"}`}>
                          <td className="px-3 py-2">
                            {ok ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </td>
                          <td className="px-3 py-2">{row.name || "—"}</td>
                          <td className="px-3 py-2">{row.price > 0 ? `${row.price} kr` : "—"}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.category}</td>
                          <td className="px-3 py-2 font-mono">{row.stock}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep("map")}
                  className="px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
                >
                  Tillbaka
                </button>
                <button
                  type="button"
                  onClick={runImport}
                  disabled={importing || validRows.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importerar...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Importera {validRows.length} produkter
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="pt-4 space-y-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <p className="text-lg font-display font-bold">Import klar!</p>
              </div>
              <div className="flex gap-4 justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{result.ok}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase">Importerade</p>
                </div>
                {result.failed > 0 && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{result.failed}</p>
                    <p className="text-xs font-mono text-muted-foreground uppercase">Misslyckades</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 text-sm hover:bg-secondary transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Importera fler
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                >
                  Klar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
