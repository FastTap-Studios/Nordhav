export const CSV_FIELDS = [
  { key: "name", label: "Namn", required: true },
  { key: "description", label: "Beskrivning", required: false },
  { key: "price", label: "Pris (SEK)", required: true },
  { key: "category", label: "Kategori", required: false },
  { key: "stock", label: "Lagersaldo", required: false },
  { key: "imageUrl", label: "Bild-URL", required: false },
] as const;

export type CsvFieldKey = (typeof CSV_FIELDS)[number]["key"];

const HEADER_ALIASES: Record<CsvFieldKey, string[]> = {
  name: ["namn", "produktnamn", "product name", "name", "title"],
  description: ["beskrivning", "desc", "description"],
  price: ["pris", "pris sek", "price", "amount"],
  category: ["kategori", "cat", "category"],
  stock: ["lager", "stock", "qty", "quantity", "antal", "lagersaldo"],
  imageUrl: ["bild", "image", "imageurl", "image url", "bild-url", "img"],
};

export interface ParsedCsvRow {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === "," || ch === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCsvText(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = parseCsvLine(lines[0]);
  const rows = lines.slice(1).filter((l) => l.trim()).map(parseCsvLine);
  return { headers, rows };
}

function normalizeHeader(h: string) {
  return h.toLowerCase().trim().replace(/[_\s-]+/g, "");
}

export function autoDetectColumnMap(headers: string[]): Partial<Record<CsvFieldKey, number>> {
  const map: Partial<Record<CsvFieldKey, number>> = {};
  const normalized = headers.map(normalizeHeader);

  for (const field of CSV_FIELDS) {
    const aliases = HEADER_ALIASES[field.key].map(normalizeHeader);
    const idx = normalized.findIndex((h) => aliases.some((a) => h.includes(a) || a.includes(h)));
    if (idx >= 0) map[field.key] = idx;
  }
  return map;
}

export function rowToProduct(
  row: string[],
  columnMap: Partial<Record<CsvFieldKey, number>>
): ParsedCsvRow {
  const get = (key: CsvFieldKey) => {
    const idx = columnMap[key];
    return idx !== undefined ? (row[idx] ?? "").trim() : "";
  };

  return {
    name: get("name"),
    description: get("description"),
    price: parseFloat(get("price").replace(",", ".")) || 0,
    category: get("category") || "Beten",
    stock: parseInt(get("stock"), 10) || 0,
    imageUrl: get("imageUrl"),
  };
}

export function isValidImportRow(row: ParsedCsvRow) {
  return Boolean(row.name && row.price > 0);
}

export function downloadCsvTemplate() {
  const header = CSV_FIELDS.map((f) => f.label).join(",");
  const example =
    "Nordhav Jerkbait,Premium jerkbait för gädda,249,Beten,18,https://example.com/bild.jpg";
  const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "nordhav-produktmall.csv";
  a.click();
  URL.revokeObjectURL(url);
}
