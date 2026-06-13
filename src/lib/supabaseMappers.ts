import { DiscountCode, Order, Product, ReturnRequest } from "../types";
import { resolveImageUrl, resolveImageUrls } from "./images";

/* eslint-disable @typescript-eslint/no-explicit-any */

function normalizeImageUrls(raw: unknown): string[] {
  if (Array.isArray(raw)) return resolveImageUrls(raw as string[]);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? resolveImageUrls(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function productFromRow(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    price: Number(row.price),
    imageUrl: resolveImageUrl(row.image_url ?? ""),
    imageUrls: normalizeImageUrls(row.image_urls),
    stock: row.stock ?? 0,
    category: row.category ?? "Beten",
    createdAt: row.created_at,
    nameEn: row.name_en ?? undefined,
    nameNo: row.name_no ?? undefined,
    descriptionEn: row.description_en ?? undefined,
    descriptionNo: row.description_no ?? undefined,
    compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
    sku: row.sku ?? undefined,
    weightGrams: row.weight_grams ?? undefined,
    lengthMm: row.length_mm ?? undefined,
    vatRate: row.vat_rate != null ? Number(row.vat_rate) : undefined,
    depthRange: row.depth_range ?? undefined,
    color: row.color ?? undefined,
    speciesTarget: row.species_target ?? undefined,
    tags: row.tags ?? undefined,
    isActive: row.is_active ?? true,
    isFeatured: row.is_featured ?? false,
  };
}

export function productToRow(product: Partial<Product>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (product.name !== undefined) row.name = product.name;
  if (product.description !== undefined) row.description = product.description;
  if (product.price !== undefined) row.price = product.price;
  if (product.imageUrl !== undefined) row.image_url = product.imageUrl;
  if (product.imageUrls !== undefined) row.image_urls = product.imageUrls;
  if (product.stock !== undefined) row.stock = product.stock;
  if (product.category !== undefined) row.category = product.category;
  if (product.nameEn !== undefined) row.name_en = product.nameEn;
  if (product.nameNo !== undefined) row.name_no = product.nameNo;
  if (product.descriptionEn !== undefined) row.description_en = product.descriptionEn;
  if (product.descriptionNo !== undefined) row.description_no = product.descriptionNo;
  if (product.compareAtPrice !== undefined) row.compare_at_price = product.compareAtPrice;
  if (product.sku !== undefined) row.sku = product.sku;
  if (product.weightGrams !== undefined) row.weight_grams = product.weightGrams;
  if (product.lengthMm !== undefined) row.length_mm = product.lengthMm;
  if (product.vatRate !== undefined) row.vat_rate = product.vatRate;
  if (product.depthRange !== undefined) row.depth_range = product.depthRange;
  if (product.color !== undefined) row.color = product.color;
  if (product.speciesTarget !== undefined) row.species_target = product.speciesTarget;
  if (product.tags !== undefined) row.tags = product.tags;
  if (product.isActive !== undefined) row.is_active = product.isActive;
  if (product.isFeatured !== undefined) row.is_featured = product.isFeatured;
  return row;
}

export function orderFromRow(row: any): Order {
  return {
    id: row.id,
    userId: row.user_id ?? "",
    email: row.email,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    items: row.items ?? [],
    subtotal: row.subtotal != null ? Number(row.subtotal) : undefined,
    totalAmount: Number(row.total_amount),
    status: row.status,
    createdAt: row.created_at,
    shippingAddress: row.shipping_address ?? {},
    vatAmount: Number(row.vat_amount ?? 0),
    shippingCost: Number(row.shipping_cost ?? 0),
    discountAmount: row.discount_amount != null ? Number(row.discount_amount) : undefined,
    discountCode: row.discount_code ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    paymentStatus: row.payment_status ?? undefined,
  };
}

export function orderToRow(order: Partial<Order> | Omit<Order, "id">): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ("userId" in order && order.userId !== undefined) row.user_id = order.userId;
  if ("email" in order && order.email !== undefined) row.email = order.email;
  if ("customerName" in order && order.customerName !== undefined) row.customer_name = order.customerName;
  if ("customerPhone" in order && order.customerPhone !== undefined) row.customer_phone = order.customerPhone;
  if ("items" in order && order.items !== undefined) row.items = order.items;
  if ("subtotal" in order && order.subtotal !== undefined) row.subtotal = order.subtotal;
  if ("totalAmount" in order && order.totalAmount !== undefined) row.total_amount = order.totalAmount;
  if ("status" in order && order.status !== undefined) row.status = order.status;
  if ("shippingAddress" in order && order.shippingAddress !== undefined) row.shipping_address = order.shippingAddress;
  if ("vatAmount" in order && order.vatAmount !== undefined) row.vat_amount = order.vatAmount;
  if ("shippingCost" in order && order.shippingCost !== undefined) row.shipping_cost = order.shippingCost;
  if ("discountAmount" in order && order.discountAmount !== undefined) row.discount_amount = order.discountAmount;
  if ("discountCode" in order && order.discountCode !== undefined) row.discount_code = order.discountCode;
  if ("trackingNumber" in order && order.trackingNumber !== undefined) row.tracking_number = order.trackingNumber;
  if ("paymentStatus" in order && order.paymentStatus !== undefined) row.payment_status = order.paymentStatus;
  return row;
}

export function returnFromRow(row: any): ReturnRequest {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    reason: row.reason,
    reasonDetails: row.reason_details ?? undefined,
    status: row.status,
    refundAmount: Number(row.refund_amount),
    items: row.items ?? [],
    createdAt: row.created_at,
  };
}

export function returnToRow(item: Partial<ReturnRequest>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (item.orderId !== undefined) row.order_id = item.orderId;
  if (item.orderNumber !== undefined) row.order_number = item.orderNumber;
  if (item.customerName !== undefined) row.customer_name = item.customerName;
  if (item.customerEmail !== undefined) row.customer_email = item.customerEmail;
  if (item.reason !== undefined) row.reason = item.reason;
  if (item.reasonDetails !== undefined) row.reason_details = item.reasonDetails;
  if (item.status !== undefined) row.status = item.status;
  if (item.refundAmount !== undefined) row.refund_amount = item.refundAmount;
  if (item.items !== undefined) row.items = item.items;
  return row;
}

export function discountFromRow(row: any): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minOrderAmount: Number(row.min_order_amount ?? 0),
    maxUses: row.max_uses ?? 0,
    usedCount: row.used_count ?? 0,
    isActive: row.is_active ?? true,
    validFrom: row.valid_from ?? "",
    validUntil: row.valid_until ?? "",
  };
}

export function discountToRow(item: Partial<DiscountCode>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (item.code !== undefined) row.code = item.code;
  if (item.type !== undefined) row.type = item.type;
  if (item.value !== undefined) row.value = item.value;
  if (item.minOrderAmount !== undefined) row.min_order_amount = item.minOrderAmount;
  if (item.maxUses !== undefined) row.max_uses = item.maxUses;
  if (item.usedCount !== undefined) row.used_count = item.usedCount;
  if (item.isActive !== undefined) row.is_active = item.isActive;
  if (item.validFrom !== undefined) row.valid_from = item.validFrom || null;
  if (item.validUntil !== undefined) row.valid_until = item.validUntil || null;
  return row;
}
