import { DiscountCode } from "../types";

export const DISCOUNT_STORAGE_KEY = "nordhav_applied_discount";

export function loadStoredDiscount(): DiscountCode | null {
  try {
    const raw = sessionStorage.getItem(DISCOUNT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DiscountCode) : null;
  } catch {
    return null;
  }
}

export function storeDiscount(discount: DiscountCode | null) {
  if (discount) {
    sessionStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(discount));
  } else {
    sessionStorage.removeItem(DISCOUNT_STORAGE_KEY);
  }
}

export const FREE_SHIPPING_THRESHOLD = 799;
export const STANDARD_SHIPPING_COST = 49;

export interface CheckoutTotals {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  vatAmount: number;
  total: number;
}

export function calculateCheckoutTotals(
  subtotal: number,
  discount: DiscountCode | null
): CheckoutTotals {
  let discountAmount = 0;
  let shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_COST;

  if (discount && subtotal >= discount.minOrderAmount) {
    if (discount.type === "percent") {
      discountAmount = Math.round(subtotal * (discount.value / 100));
    } else if (discount.type === "fixed_amount") {
      discountAmount = Math.min(subtotal, discount.value);
    } else if (discount.type === "free_shipping") {
      shippingCost = 0;
    }
  }

  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const vatAmount = Math.round(afterDiscount * 0.25);
  const total = afterDiscount + shippingCost;

  return { subtotal, discountAmount, shippingCost, vatAmount, total };
}

export interface CheckoutFormData {
  email: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export const emptyCheckoutForm = (): CheckoutFormData => ({
  email: "",
  name: "",
  phone: "",
  street: "",
  city: "",
  postalCode: "",
  country: "Sverige",
});

export function loadCheckoutForm(): CheckoutFormData {
  try {
    const raw = sessionStorage.getItem("nordhav_checkout_form");
    if (raw) return { ...emptyCheckoutForm(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return emptyCheckoutForm();
}

export function saveCheckoutForm(data: CheckoutFormData) {
  sessionStorage.setItem("nordhav_checkout_form", JSON.stringify(data));
}

export function generateOrderNumber(): string {
  return `NORD-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}
