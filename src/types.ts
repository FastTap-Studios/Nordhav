export interface ProductVariant {
  id: string;
  label: string;
  stock: number;
  sku?: string;
  /** Vikt i gram — används för beten */
  weightGrams?: number;
  /** Storlek — används för fiskekläder */
  size?: string;
  /** Färg — används för beten och fiskekläder */
  color?: string;
  /** Produktbild för denna färg/variant */
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  stock: number;
  category: string;
  createdAt: string;
  variantLabel?: string;
  variants?: ProductVariant[];
  nameEn?: string;
  nameNo?: string;
  descriptionEn?: string;
  descriptionNo?: string;
  compareAtPrice?: number;
  sku?: string;
  weightGrams?: number;
  lengthMm?: number;
  vatRate?: number;
  depthRange?: string;
  color?: string;
  speciesTarget?: string[];
  tags?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

export type DiscountType = "percent" | "fixed_amount" | "free_shipping";

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string;
}

export interface CartItem extends Product {
  quantity: number;
  cartLineId: string;
  selectedVariant?: ProductVariant;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "returned";

export interface ShippingAddress {
  name?: string;
  street?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  postal_code?: string;
  country?: string;
}

export interface Order {
  id: string;
  userId: string;
  email: string;
  customerName?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal?: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  shippingAddress: ShippingAddress;
  vatAmount: number;
  shippingCost: number;
  discountAmount?: number;
  discountCode?: string;
  trackingNumber?: string;
  paymentStatus?: string;
}

export type ReturnReason = "defect" | "wrong_product" | "regret" | "shipping_damage" | "other";
export type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

export interface ReturnItem {
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: ReturnReason;
  reasonDetails?: string;
  status: ReturnStatus;
  refundAmount: number;
  items: ReturnItem[];
  createdAt: string;
}

export interface UserRole {
  email: string;
  role: "admin" | "customer";
}

export interface StaffMember {
  id: string;
  email: string;
  fullName: string;
  role: "admin";
  isActive: boolean;
  createdAt: string;
  createdBy?: string;
  lastLoginAt?: string | null;
}

export function orderNumber(id: string) {
  return `NH-${id.slice(-8).toUpperCase()}`;
}

export function orderSubtotal(order: Order) {
  if (order.subtotal != null) return order.subtotal;
  return order.items.reduce((s, i) => s + i.price * i.quantity, 0);
}
