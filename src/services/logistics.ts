export type CountryCode = "SE" | "NO" | "DK" | "FI" | "DE";

export interface ShippingRate {
  standard: number;
  express: number;
  free_threshold: number;
  label: string;
}

export interface VatRate {
  rate: number;
  label: string;
}

export const SHIPPING_RATES: Record<CountryCode, ShippingRate> = {
  SE: { standard: 49, express: 129, free_threshold: 500, label: "Sverige" },
  NO: { standard: 99, express: 199, free_threshold: 800, label: "Norge" },
  DK: { standard: 99, express: 189, free_threshold: 800, label: "Danmark" },
  FI: { standard: 99, express: 199, free_threshold: 800, label: "Finland" },
  DE: { standard: 149, express: 249, free_threshold: 1000, label: "Tyskland" },
};

export const VAT_RATES: Record<CountryCode, VatRate> = {
  SE: { rate: 25, label: "Sverige" },
  NO: { rate: 25, label: "Norge" },
  DK: { rate: 25, label: "Danmark" },
  FI: { rate: 24, label: "Finland" },
  DE: { rate: 19, label: "Tyskland" },
};

export function calcShipping(country: CountryCode, weightGrams: number, orderAmount: number) {
  const rate = SHIPPING_RATES[country];
  const weightSurcharge = Math.floor(weightGrams / 1000) * 10;
  const standard = orderAmount >= rate.free_threshold ? 0 : rate.standard + weightSurcharge;
  const express = rate.express + weightSurcharge;
  return { standard, express, weightSurcharge, rate };
}

export function calcVat(country: CountryCode, amountExVat: number) {
  const vat = VAT_RATES[country];
  const vatAmount = amountExVat * (vat.rate / 100);
  return { vatAmount, totalInclVat: amountExVat + vatAmount, vat };
}
