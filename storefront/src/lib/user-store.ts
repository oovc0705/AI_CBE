/**
 * 用户数据存储：购物车 / 订单 / 收货地址
 *
 * 数据按用户 ID 隔离，未登录时使用 'guest'。
 * 登录/登出时自动迁移访客数据。
 *
 * 订单快照：当前结账会向 /api/orders POST 创建订单；创建成功后将
 * 订单摘要写入对应用户的本地存储，作为「我的订单」列表数据源。
 * 远端是真实数据源，本地缓存用于离线/快速加载。
 */

import { onAuthChange, getCurrentUser, generateId } from './auth';
import type { CartItem } from './cart';

// ─────────────────────────────────────────────────────────────
// Key 工具
// ─────────────────────────────────────────────────────────────
const GUEST_ID = 'guest';

export function activeUserId(): string {
  if (typeof window === 'undefined') return GUEST_ID;
  const u = getCurrentUser();
  return u ? u.id : GUEST_ID;
}

function namespacedKey(scope: string, userId: string, name: string): string {
  return `storefront:${scope}:${userId}:${name}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

function removeKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────
// 购物车
// ─────────────────────────────────────────────────────────────
const cartKey = (uid: string) => namespacedKey('cart', uid, 'items');

export function getUserCart(uid?: string): CartItem[] {
  return readJson<CartItem[]>(cartKey(uid ?? activeUserId()), []);
}

export function saveUserCart(items: CartItem[], uid?: string): void {
  writeJson(cartKey(uid ?? activeUserId()), items);
  notifyStoreChange('cart');
}

export function addToUserCart(item: CartItem, uid?: string): void {
  const id = uid ?? activeUserId();
  const cart = getUserCart(id);
  const existing = cart.find((i) => i.productId === item.productId);
  if (existing) existing.quantity += item.quantity;
  else cart.push(item);
  saveUserCart(cart, id);
}

export function updateUserCartQuantity(productId: number, quantity: number, uid?: string): void {
  const id = uid ?? activeUserId();
  const cart = getUserCart(id);
  if (quantity <= 0) {
    saveUserCart(cart.filter((i) => i.productId !== productId), id);
    return;
  }
  const target = cart.find((i) => i.productId === productId);
  if (target) {
    target.quantity = quantity;
    saveUserCart(cart, id);
  }
}

export function removeFromUserCart(productId: number, uid?: string): void {
  const id = uid ?? activeUserId();
  saveUserCart(getUserCart(id).filter((i) => i.productId !== productId), id);
}

export function clearUserCart(uid?: string): void {
  saveUserCart([], uid ?? activeUserId());
}

// ─────────────────────────────────────────────────────────────
// 订单快照
// ─────────────────────────────────────────────────────────────
export interface OrderSummary {
  id: number;
  orderNo: string;
  totalAmount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  customerEmail?: string;
  shippingAddress?: Record<string, string>;
  items: Array<{
    productId: number;
    name?: string;
    price: number;
    quantity: number;
    imageUrl?: string;
    slug?: string;
  }>;
  createdAt: number;
}

const ordersKey = (uid: string) => namespacedKey('orders', uid, 'list');

export function getUserOrders(uid?: string): OrderSummary[] {
  return readJson<OrderSummary[]>(ordersKey(uid ?? activeUserId()), []);
}

export function saveUserOrders(orders: OrderSummary[], uid?: string): void {
  writeJson(ordersKey(uid ?? activeUserId()), orders);
  notifyStoreChange('orders');
}

export function appendUserOrder(order: OrderSummary, uid?: string): void {
  const id = uid ?? activeUserId();
  const list = getUserOrders(id);
  // 避免重复（按 orderNo 去重）
  if (list.some((o) => o.orderNo === order.orderNo)) {
    return;
  }
  list.unshift(order);
  saveUserOrders(list, id);
}

export function updateUserOrder(orderNo: string, patch: Partial<OrderSummary>, uid?: string): void {
  const id = uid ?? activeUserId();
  const list = getUserOrders(id);
  const idx = list.findIndex((o) => o.orderNo === orderNo);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  saveUserOrders(list, id);
}

// ─────────────────────────────────────────────────────────────
// 收货地址
// ─────────────────────────────────────────────────────────────
export interface SavedAddress {
  id: string;
  fullName: string;
  phone?: string;
  street: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

const addrKey = (uid: string) => namespacedKey('address', uid, 'list');

export function getUserAddresses(uid?: string): SavedAddress[] {
  return readJson<SavedAddress[]>(addrKey(uid ?? activeUserId()), []);
}

export function saveUserAddresses(list: SavedAddress[], uid?: string): void {
  writeJson(addrKey(uid ?? activeUserId()), list);
  notifyStoreChange('addresses');
}

export function addUserAddress(addr: Omit<SavedAddress, 'id'>, uid?: string): SavedAddress {
  const id = uid ?? activeUserId();
  const list = getUserAddresses(id);
  if (addr.isDefault) list.forEach((a) => (a.isDefault = false));
  const created: SavedAddress = { ...addr, id: generateId('addr') };
  list.push(created);
  saveUserAddresses(list, id);
  return created;
}

// ─────────────────────────────────────────────────────────────
// 迁移：登录时把访客数据合并到用户账号
// ─────────────────────────────────────────────────────────────
export function mergeGuestIntoUser(userId: string): void {
  if (typeof window === 'undefined' || !userId || userId === GUEST_ID) return;

  // 购物车
  const guestCart = readJson<CartItem[]>(cartKey(GUEST_ID), []);
  const userCart = readJson<CartItem[]>(cartKey(userId), []);
  if (guestCart.length > 0) {
    const merged = [...userCart];
    for (const item of guestCart) {
      const ex = merged.find((i) => i.productId === item.productId);
      if (ex) ex.quantity += item.quantity;
      else merged.push(item);
    }
    writeJson(cartKey(userId), merged);
    removeKey(cartKey(GUEST_ID));
  }

  // 订单
  const guestOrders = readJson<OrderSummary[]>(ordersKey(GUEST_ID), []);
  const userOrders = readJson<OrderSummary[]>(ordersKey(userId), []);
  if (guestOrders.length > 0) {
    const seen = new Set(userOrders.map((o) => o.orderNo));
    const merged = [...userOrders];
    for (const o of guestOrders) {
      if (!seen.has(o.orderNo)) merged.unshift(o);
    }
    writeJson(ordersKey(userId), merged);
    removeKey(ordersKey(GUEST_ID));
  }

  // 地址
  const guestAddr = readJson<SavedAddress[]>(addrKey(GUEST_ID), []);
  const userAddr = readJson<SavedAddress[]>(addrKey(userId), []);
  if (guestAddr.length > 0 && userAddr.length === 0) {
    writeJson(addrKey(userId), guestAddr);
    removeKey(addrKey(GUEST_ID));
  } else {
    removeKey(addrKey(GUEST_ID));
  }
}

// ─────────────────────────────────────────────────────────────
// 跨组件 store 变化通知
// ─────────────────────────────────────────────────────────────
export type StoreScope = 'cart' | 'orders' | 'addresses';
const STORE_EVENT = 'storefront-store-changed';

export interface StoreChangeEvent {
  scope: StoreScope;
  userId: string;
}

export function onStoreChange(cb: (e: StoreChangeEvent) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<StoreChangeEvent>).detail;
    if (detail) cb(detail);
  };
  window.addEventListener(STORE_EVENT, handler);
  return () => window.removeEventListener(STORE_EVENT, handler);
}

function notifyStoreChange(scope: StoreScope): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<StoreChangeEvent>(STORE_EVENT, { detail: { scope, userId: activeUserId() } }),
  );
}

// 当 auth 变化时，触发各 scope 通知（让 cart/orders UI 重新加载）
if (typeof window !== 'undefined') {
  onAuthChange(() => {
    notifyStoreChange('cart');
    notifyStoreChange('orders');
    notifyStoreChange('addresses');
  });
}
