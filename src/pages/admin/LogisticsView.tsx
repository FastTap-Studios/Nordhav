import { useState } from "react";
import { Truck, Receipt, List } from "lucide-react";
import { AdminInput, AdminSelect, FieldLabel } from "../../components/admin/AdminDialog";
import {
  calcShipping,
  calcVat,
  CountryCode,
  SHIPPING_RATES,
  VAT_RATES,
} from "../../services/logistics";

export default function LogisticsView() {
  const [shipCountry, setShipCountry] = useState<CountryCode>("SE");
  const [weightGrams, setWeightGrams] = useState(500);
  const [orderAmount, setOrderAmount] = useState(300);

  const [vatCountry, setVatCountry] = useState<CountryCode>("SE");
  const [amountExVat, setAmountExVat] = useState(1000);

  const shipping = calcShipping(shipCountry, weightGrams, orderAmount);
  const vat = calcVat(vatCountry, amountExVat);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold">Logistik</h1>
        <p className="text-sm text-muted-foreground mt-1">Frakt, moms och betalningsinställningar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Truck className="w-5 h-5 text-primary" />
              Fraktkalkylator
            </div>
          </div>
          <div className="p-6 pt-2 space-y-4">
            <div>
              <FieldLabel>Land</FieldLabel>
              <AdminSelect
                value={shipCountry}
                onChange={(e) => setShipCountry(e.target.value as CountryCode)}
              >
                {Object.entries(SHIPPING_RATES).map(([code, rate]) => (
                  <option key={code} value={code}>
                    {rate.label}
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Vikt (gram)</FieldLabel>
                <AdminInput
                  type="number"
                  min={0}
                  value={weightGrams}
                  onChange={(e) => setWeightGrams(Number(e.target.value))}
                />
              </div>
              <div>
                <FieldLabel>Orderbelopp (kr)</FieldLabel>
                <AdminInput
                  type="number"
                  min={0}
                  value={orderAmount}
                  onChange={(e) => setOrderAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="mt-2 space-y-3 p-4 bg-secondary/30 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Standardfrakt</span>
                <span className="font-bold">
                  {shipping.standard === 0 ? (
                    <span className="text-primary">Fri frakt</span>
                  ) : (
                    `${shipping.standard} kr`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expressfrakt</span>
                <span className="font-bold">{shipping.express} kr</span>
              </div>
              {shipping.standard > 0 && (
                <p className="text-[10px] text-muted-foreground font-mono mt-2">
                  Fri standardfrakt från {shipping.rate.free_threshold} kr
                </p>
              )}
              {shipping.weightSurcharge > 0 && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  Viktillägg: +{shipping.weightSurcharge} kr
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card border-border/30">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Receipt className="w-5 h-5 text-primary" />
              Momskalkylator
            </div>
          </div>
          <div className="p-6 pt-2 space-y-4">
            <div>
              <FieldLabel>Land</FieldLabel>
              <AdminSelect
                value={vatCountry}
                onChange={(e) => setVatCountry(e.target.value as CountryCode)}
              >
                {Object.entries(VAT_RATES).map(([code, rate]) => (
                  <option key={code} value={code}>
                    {rate.label} ({rate.rate}%)
                  </option>
                ))}
              </AdminSelect>
            </div>

            <div>
              <FieldLabel>Belopp exkl. moms (kr)</FieldLabel>
              <AdminInput
                type="number"
                min={0}
                value={amountExVat}
                onChange={(e) => setAmountExVat(Number(e.target.value))}
              />
            </div>

            <div className="mt-2 space-y-3 p-4 bg-secondary/30 rounded-xl">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exkl. moms</span>
                <span>{amountExVat.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Moms ({vat.vat.rate}%)</span>
                <span>{vat.vatAmount.toFixed(2)} kr</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                <span>Inkl. moms</span>
                <span>{vat.totalInclVat.toFixed(2)} kr</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card border-border/30">
        <div className="flex flex-col space-y-1.5 p-6 pb-2">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <List className="w-5 h-5 text-primary" />
            Fraktprislista
          </div>
        </div>
        <div className="px-6 pb-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/30 text-left">
                <th className="p-3 font-mono text-xs text-muted-foreground tracking-wider">LAND</th>
                <th className="p-3 font-mono text-xs text-muted-foreground tracking-wider">STANDARD</th>
                <th className="p-3 font-mono text-xs text-muted-foreground tracking-wider">EXPRESS</th>
                <th className="p-3 font-mono text-xs text-muted-foreground tracking-wider">FRI FRAKT FRÅN</th>
                <th className="p-3 font-mono text-xs text-muted-foreground tracking-wider">MOMS</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SHIPPING_RATES).map(([code, rate]) => (
                <tr key={code} className="border-b border-border/20">
                  <td className="p-3 font-medium">{rate.label}</td>
                  <td className="p-3">{rate.standard} kr</td>
                  <td className="p-3">{rate.express} kr</td>
                  <td className="p-3 text-primary">{rate.free_threshold} kr</td>
                  <td className="p-3">{VAT_RATES[code as CountryCode]?.rate ?? 25}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
