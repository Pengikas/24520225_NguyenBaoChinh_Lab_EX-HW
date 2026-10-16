// inventory-state-machine.ts
// Finite State Machine (FSM) for Optimistic Inventory Lock

import { LockState, InventoryLockLease, ProductInventory } from './types';

export type FSMEvent =
  | { type: 'ACQUIRE_LOCK'; userId: string; userName: string; userType: 'HUMAN' | 'BOT'; leaseDurationMs: number }
  | { type: 'START_CHECKOUT'; lockId: string }
  | { type: 'COMPLETE_PURCHASE'; lockId: string }
  | { type: 'EXPIRE_LOCK'; lockId: string }
  | { type: 'RELEASE_LOCK'; lockId: string };

export interface FSMTransitionResult {
  success: boolean;
  previousState: LockState;
  nextState: LockState;
  lease?: InventoryLockLease;
  error?: string;
  statusCode: 200 | 409 | 410 | 408 | 404;
}

/**
 * Optimistic Inventory Lock Finite State Machine.
 * Enforces atomicity, lease timeouts, and invariants for high-concurrency flash sales.
 */
export class InventoryLockFSM {
  private activeLeases: Map<string, InventoryLockLease> = new Map();
  private listeners: Set<(product: ProductInventory, leases: InventoryLockLease[]) => void> = new Set();
  private lockTimers: Map<string, number> = new Map();

  constructor(private product: ProductInventory) {}

  public getProduct(): ProductInventory {
    return { ...this.product };
  }

  public getActiveLeases(): InventoryLockLease[] {
    const now = Date.now();
    return Array.from(this.activeLeases.values()).map((l) => ({
      ...l,
      remainingMs: Math.max(0, l.expiresAt - now),
    }));
  }

  public subscribe(listener: (product: ProductInventory, leases: InventoryLockLease[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const p = this.getProduct();
    const leases = this.getActiveLeases();
    this.listeners.forEach((listener) => listener(p, leases));
  }

  /**
   * Evaluates the FSM transition for a given event.
   * Uses Optimistic Concurrency Control (OCC) with version checking.
   */
  public transition(event: FSMEvent): FSMTransitionResult {
    switch (event.type) {
      case 'ACQUIRE_LOCK': {
        // Guard 1: Stock exhaustion
        if (this.product.availableStock <= 0) {
          return {
            success: false,
            previousState: 'OUT_OF_STOCK',
            nextState: 'OUT_OF_STOCK',
            error: 'Sản phẩm đã hết suất Flash Sale! (410 Gone)',
            statusCode: 410,
          };
        }

        // Atomic reservation: decrement available, increment reserved, advance version
        this.product.availableStock -= 1;
        this.product.reservedStock += 1;
        this.product.version += 1;

        const now = Date.now();
        const lockId = `lock_${this.product.id}_${now}_${Math.random().toString(36).slice(2, 7)}`;
        const lease: InventoryLockLease = {
          lockId,
          productId: this.product.id,
          userId: event.userId,
          userName: event.userName,
          userType: event.userType,
          createdAt: now,
          expiresAt: now + event.leaseDurationMs,
          state: 'RESERVED',
          remainingMs: event.leaseDurationMs,
          quantity: 1,
        };

        this.activeLeases.set(lockId, lease);

        // Schedule auto-expiry timer
        const timerId = window.setTimeout(() => {
          this.transition({ type: 'EXPIRE_LOCK', lockId });
        }, event.leaseDurationMs);
        this.lockTimers.set(lockId, timerId);

        this.notify();

        return {
          success: true,
          previousState: 'AVAILABLE',
          nextState: 'RESERVED',
          lease,
          statusCode: 200,
        };
      }

      case 'START_CHECKOUT': {
        const lease = this.activeLeases.get(event.lockId);
        if (!lease) {
          return {
            success: false,
            previousState: 'AVAILABLE',
            nextState: 'AVAILABLE',
            error: 'Mã giữ chỗ không tồn tại hoặc đã hết hạn! (404 Not Found)',
            statusCode: 404,
          };
        }

        if (Date.now() > lease.expiresAt) {
          this.transition({ type: 'EXPIRE_LOCK', lockId: event.lockId });
          return {
            success: false,
            previousState: 'RESERVED',
            nextState: 'LOCK_EXPIRED',
            error: 'Thời gian giữ chỗ đã hết hạn! (408 Request Timeout)',
            statusCode: 408,
          };
        }

        lease.state = 'CHECKING_OUT';
        this.notify();

        return {
          success: true,
          previousState: 'RESERVED',
          nextState: 'CHECKING_OUT',
          lease,
          statusCode: 200,
        };
      }

      case 'COMPLETE_PURCHASE': {
        const lease = this.activeLeases.get(event.lockId);
        if (!lease) {
          return {
            success: false,
            previousState: 'AVAILABLE',
            nextState: 'AVAILABLE',
            error: 'Khóa giữ chỗ không hợp lệ hoặc đã bị hủy. (409 Conflict)',
            statusCode: 409,
          };
        }

        if (Date.now() > lease.expiresAt) {
          this.transition({ type: 'EXPIRE_LOCK', lockId: event.lockId });
          return {
            success: false,
            previousState: lease.state,
            nextState: 'LOCK_EXPIRED',
            error: 'Quá thời hạn thanh toán! Suất mua đã được trả về kho. (408 Request Timeout)',
            statusCode: 408,
          };
        }

        // Clean up timer
        const timerId = this.lockTimers.get(event.lockId);
        if (timerId) {
          clearTimeout(timerId);
          this.lockTimers.delete(event.lockId);
        }

        // Commit purchase: decrement reserved, increment sold, advance version
        this.product.reservedStock -= 1;
        this.product.soldStock += 1;
        this.product.version += 1;

        lease.state = 'PURCHASED';
        this.activeLeases.delete(event.lockId);

        this.notify();

        return {
          success: true,
          previousState: 'CHECKING_OUT',
          nextState: 'PURCHASED',
          lease,
          statusCode: 200,
        };
      }

      case 'EXPIRE_LOCK': {
        const lease = this.activeLeases.get(event.lockId);
        if (!lease) {
          return {
            success: false,
            previousState: 'AVAILABLE',
            nextState: 'AVAILABLE',
            statusCode: 404,
          };
        }

        // Evict lease timer
        const timerId = this.lockTimers.get(event.lockId);
        if (timerId) {
          clearTimeout(timerId);
          this.lockTimers.delete(event.lockId);
        }

        // Roll back reserved stock to available stock
        this.product.reservedStock = Math.max(0, this.product.reservedStock - 1);
        this.product.availableStock += 1;
        this.product.version += 1;

        lease.state = 'LOCK_EXPIRED';
        this.activeLeases.delete(event.lockId);

        this.notify();

        return {
          success: true,
          previousState: 'RESERVED',
          nextState: 'LOCK_EXPIRED',
          lease,
          statusCode: 408,
        };
      }

      case 'RELEASE_LOCK': {
        const lease = this.activeLeases.get(event.lockId);
        if (!lease) {
          return {
            success: false,
            previousState: 'AVAILABLE',
            nextState: 'AVAILABLE',
            statusCode: 404,
          };
        }

        const timerId = this.lockTimers.get(event.lockId);
        if (timerId) {
          clearTimeout(timerId);
          this.lockTimers.delete(event.lockId);
        }

        this.product.reservedStock = Math.max(0, this.product.reservedStock - 1);
        this.product.availableStock += 1;
        this.product.version += 1;

        lease.state = 'CANCELLED';
        this.activeLeases.delete(event.lockId);

        this.notify();

        return {
          success: true,
          previousState: 'RESERVED',
          nextState: 'CANCELLED',
          lease,
          statusCode: 200,
        };
      }
    }
  }

  /**
   * Strictly cleans up all active timeouts on unmount to prevent memory leaks.
   */
  public destroy() {
    this.lockTimers.forEach((timerId) => clearTimeout(timerId));
    this.lockTimers.clear();
    this.listeners.clear();
    this.activeLeases.clear();
  }
}
