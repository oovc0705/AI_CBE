/**
 * 购物车（兼容层）。
 *
 * 真实存储在 user-store 中按用户 ID 隔离（已登录用户/访客）。
 * 保留同名 API 以便现有调用方无感迁移。
 */

import {
  getUserCart,
  saveUserCart,
  addToUserCart,
  updateUserCartQuantity,
  removeFromUserCart,
  clearUserCart,
  onStoreChange,
} from './user-store';

export interface CartItem {
  productId: number;
  quantity: number;
  name?: string;
  price?: number;
  imageUrl?: string;
}

export function getCart(): CartItem[] {
  return getUserCart();
}

export function saveCart(items: CartItem[]): void {
  saveUserCart(items);
}

export function addToCart(item: CartItem): void {
  addToUserCart(item);
}

export function removeFromCart(productId: number): void {
  removeFromUserCart(productId);
}

export function updateCartQuantity(productId: number, quantity: number): void {
  updateUserCartQuantity(productId, quantity);
}

export function clearCart(): void {
  clearUserCart();
}

export { onStoreChange };
