// types.ts
// Domain Types for High-Concurrency Flash-Sale E-Commerce Engine

export type LockState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'CHECKING_OUT'
  | 'PURCHASED'
  | 'LOCK_EXPIRED'
  | 'CANCELLED'
  | 'OUT_OF_STOCK';

export interface ProductInventory {
  id: string;
  name: string;
  brand: string;
  originalPrice: number; // in VND (₫)
  flashSalePrice: number; // in VND (₫)
  discountPercent: number;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  soldStock: number;
  category: string;
  image: string;
  description: string;
  version: number; // Optimistic concurrency version
}

export interface InventoryLockLease {
  lockId: string;
  productId: string;
  userId: string;
  userName: string;
  userType: 'HUMAN' | 'BOT';
  createdAt: number;
  expiresAt: number;
  state: LockState;
  remainingMs: number;
  quantity: number;
}

export interface OrderRecord {
  orderId: string;
  lockId: string;
  productId: string;
  productName: string;
  buyerName: string;
  userType: 'HUMAN' | 'BOT';
  pricePaid: number;
  timestamp: number;
  paymentMethod: 'MOMO' | 'VNPAY' | 'SHOPEEPAY' | 'COD';
  status: 'COMPLETED';
}

export interface ConcurrencyLogEntry {
  id: string;
  timestamp: number;
  formattedTime: string;
  threadId: string;
  action: 'LOCK_ATTEMPT' | 'LOCK_ACQUIRED' | 'LOCK_CONFLICT' | 'CHECKOUT_SUCCESS' | 'LOCK_TIMEOUT' | 'LOCK_RELEASED';
  productId: string;
  productName: string;
  userId: string;
  status: 200 | 400 | 404 | 408 | 409 | 410 | 500;
  message: string;
  version: number;
}

export interface ConcurrencyMetrics {
  totalRequests: number;
  successfulReservations: number;
  conflicts409: number;
  lockTimeouts: number;
  completedOrders: number;
  oversellViolations: number; // Must strictly remain 0
  peakRps: number;
}
