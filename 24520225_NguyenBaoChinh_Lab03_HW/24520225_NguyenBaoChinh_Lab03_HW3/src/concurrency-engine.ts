// concurrency-engine.ts
// Atomic Inventory Manager & High-Concurrency Race Condition Simulator

import { InventoryLockFSM } from './inventory-state-machine';
import {
  ProductInventory,
  InventoryLockLease,
  OrderRecord,
  ConcurrencyLogEntry,
  ConcurrencyMetrics,
} from './types';

export class ConcurrencyEngine {
  private fsms: Map<string, InventoryLockFSM> = new Map();
  private orders: OrderRecord[] = [];
  private logs: ConcurrencyLogEntry[] = [];
  private inFlightClaims: Map<string, string> = new Map();
  private metrics: ConcurrencyMetrics = {
    totalRequests: 0,
    successfulReservations: 0,
    conflicts409: 0,
    lockTimeouts: 0,
    completedOrders: 0,
    oversellViolations: 0,
    peakRps: 0,
  };
  private subscribers: Set<() => void> = new Set();

  constructor(products: ProductInventory[]) {
    products.forEach((p) => {
      const fsm = new InventoryLockFSM(p);
      this.fsms.set(p.id, fsm);
    });
  }

  public subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  public getFSM(productId: string): InventoryLockFSM | undefined {
    return this.fsms.get(productId);
  }

  public getAllProducts(): ProductInventory[] {
    return Array.from(this.fsms.values()).map((fsm) => fsm.getProduct());
  }

  public getAllLeases(): InventoryLockLease[] {
    const list: InventoryLockLease[] = [];
    this.fsms.forEach((fsm) => {
      list.push(...fsm.getActiveLeases());
    });
    return list;
  }

  public getOrders(): OrderRecord[] {
    return [...this.orders];
  }

  public getLogs(): ConcurrencyLogEntry[] {
    return [...this.logs];
  }

  public getMetrics(): ConcurrencyMetrics {
    return { ...this.metrics };
  }

  public getInFlightClaimId(productId: string): string | undefined {
    return this.inFlightClaims.get(productId);
  }

  public hasInFlightClaim(productId: string): boolean {
    return this.inFlightClaims.has(productId);
  }

  private addLog(entry: Omit<ConcurrencyLogEntry, 'id' | 'timestamp' | 'formattedTime'>) {
    const now = Date.now();
    const d = new Date(now);
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    const formattedTime = `${d.toTimeString().split(' ')[0]}.${ms}`;

    const newLog: ConcurrencyLogEntry = {
      ...entry,
      id: `log_${now}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: now,
      formattedTime,
    };

    // Keep latest 250 log entries to prevent memory bloat
    this.logs.unshift(newLog);
    if (this.logs.length > 250) {
      this.logs.pop();
    }
  }

  /**
   * Asserts the mathematical invariant:
   * availableStock + reservedStock + soldStock === totalStock
   * and availableStock >= 0 (strictly zero oversell).
   */
  public verifyInventoryInvariant(productId: string): { valid: boolean; error?: string } {
    const fsm = this.fsms.get(productId);
    if (!fsm) return { valid: false, error: 'Product not found' };
    const p = fsm.getProduct();

    const sum = p.availableStock + p.reservedStock + p.soldStock;
    if (sum !== p.totalStock) {
      this.metrics.oversellViolations += 1;
      return {
        valid: false,
        error: `INVARIANT BROKEN: available(${p.availableStock}) + reserved(${p.reservedStock}) + sold(${p.soldStock}) = ${sum} != total(${p.totalStock})`,
      };
    }

    if (p.availableStock < 0) {
      this.metrics.oversellViolations += 1;
      return {
        valid: false,
        error: `OVERSELL DETECTED: availableStock is ${p.availableStock} (< 0)`,
      };
    }

    return { valid: true };
  }

  /**
   * Attempts an optimistic lock reservation.
   */
  public reserveItem(
    productId: string,
    userId: string,
    userName: string,
    userType: 'HUMAN' | 'BOT',
    leaseDurationMs = 30000,
    threadId = 'worker-main'
  ): { success: boolean; lease?: InventoryLockLease; error?: string; statusCode: number } {
    this.metrics.totalRequests += 1;
    const fsm = this.fsms.get(productId);
    if (!fsm) {
      return { success: false, error: 'Product not found', statusCode: 404 };
    }

    const p = fsm.getProduct();
    this.addLog({
      threadId,
      action: 'LOCK_ATTEMPT',
      productId,
      productName: p.name,
      userId,
      status: 200,
      message: `${userName} submitting Flash Sale reservation request...`,
      version: p.version,
    });

    const res = fsm.transition({
      type: 'ACQUIRE_LOCK',
      userId,
      userName,
      userType,
      leaseDurationMs,
    });

    if (res.success && res.lease) {
      this.metrics.successfulReservations += 1;
      this.addLog({
        threadId,
        action: 'LOCK_ACQUIRED',
        productId,
        productName: p.name,
        userId,
        status: 200,
        message: `RESERVATION SUCCESSFUL! Token: ${res.lease.lockId.slice(0, 16)}... (TTL: ${leaseDurationMs / 1000}s)`,
        version: fsm.getProduct().version,
      });
      this.verifyInventoryInvariant(productId);
      this.notify();
      return { success: true, lease: res.lease, statusCode: 200 };
    } else {
      if (res.statusCode === 410) {
        this.addLog({
          threadId,
          action: 'LOCK_CONFLICT',
          productId,
          productName: p.name,
          userId,
          status: 410,
          message: `FAILED: Product is sold out! (410 Gone)`,
          version: p.version,
        });
      } else {
        this.metrics.conflicts409 += 1;
        this.addLog({
          threadId,
          action: 'LOCK_CONFLICT',
          productId,
          productName: p.name,
          userId,
          status: 409,
          message: `INVENTORY CONFLICT: Reservation rejected due to concurrency race condition! (409 Conflict)`,
          version: p.version,
        });
      }
      this.verifyInventoryInvariant(productId);
      this.notify();
      return { success: false, error: res.error, statusCode: res.statusCode };
    }
  }

  /**
   * Finalizes checkout and creates an order record.
   */
  public checkoutOrder(
    lockId: string,
    productId: string,
    buyerName: string,
    userType: 'HUMAN' | 'BOT',
    paymentMethod: 'MOMO' | 'VNPAY' | 'SHOPEEPAY' | 'COD' = 'MOMO',
    threadId = 'worker-main'
  ): { success: boolean; order?: OrderRecord; error?: string } {
    const fsm = this.fsms.get(productId);
    if (!fsm) return { success: false, error: 'Product not found' };

    const p = fsm.getProduct();
    const res = fsm.transition({ type: 'COMPLETE_PURCHASE', lockId });

    if (res.success && res.lease) {
      const order: OrderRecord = {
        orderId: `ORD_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        lockId,
        productId,
        productName: p.name,
        buyerName,
        userType,
        pricePaid: p.flashSalePrice,
        timestamp: Date.now(),
        paymentMethod,
        status: 'COMPLETED',
      };

      this.orders.unshift(order);
      this.metrics.completedOrders += 1;

      this.addLog({
        threadId,
        action: 'CHECKOUT_SUCCESS',
        productId,
        productName: p.name,
        userId: res.lease.userId,
        status: 200,
        message: `PAYMENT SUCCESSFUL! Order ID: ${order.orderId} - ${new Intl.NumberFormat('vi-VN').format(p.flashSalePrice)} ₫`,
        version: fsm.getProduct().version,
      });

      this.verifyInventoryInvariant(productId);
      this.notify();
      return { success: true, order };
    } else {
      if (res.statusCode === 408) {
        this.metrics.lockTimeouts += 1;
      }
      this.addLog({
        threadId,
        action: 'LOCK_CONFLICT',
        productId,
        productName: p.name,
        userId: 'buyer',
        status: res.statusCode,
        message: `PAYMENT ERROR: ${res.error}`,
        version: p.version,
      });
      this.verifyInventoryInvariant(productId);
      this.notify();
      return { success: false, error: res.error };
    }
  }

  /**
   * Releases an optimistic lock back to the inventory.
   */
  public releaseLock(productId: string, lockId: string, threadId = 'worker-main'): boolean {
    const fsm = this.fsms.get(productId);
    if (!fsm) return false;

    const res = fsm.transition({ type: 'RELEASE_LOCK', lockId });
    if (res.success) {
      this.addLog({
        threadId,
        action: 'LOCK_RELEASED',
        productId,
        productName: fsm.getProduct().name,
        userId: 'client',
        status: 200,
        message: `LEASE CANCELLED: Released 1 inventory unit back to available pool.`,
        version: fsm.getProduct().version,
      });
      this.verifyInventoryInvariant(productId);
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Optimistic Crate / Ticket Claim with In-Flight `claimId` Lock & HTTP 409 Rollback.
   * Reuses InventoryLockFSM (`ACQUIRE_LOCK` -> `RELEASE_LOCK` on 409 rollback).
   */
  public async claimDropOptimistic(
    productId: string,
    userId: string,
    userName: string,
    options: {
      simulateConflict409?: boolean;
      latencyMs?: number;
      leaseDurationMs?: number;
      isExpiredPhase?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    claimId: string;
    statusCode: 200 | 408 | 409 | 410 | 404;
    rolledBack: boolean;
    lease?: InventoryLockLease;
    error?: string;
  }> {
    const {
      simulateConflict409 = false,
      latencyMs = 260,
      leaseDurationMs = 30000,
      isExpiredPhase = false,
    } = options;

    // 1. Prevent duplicate clicks using in-flight claimId lock
    const existingClaimId = this.inFlightClaims.get(productId);
    if (existingClaimId) {
      this.addLog({
        threadId: 'claim-guard',
        action: 'LOCK_CONFLICT',
        productId,
        productName: this.fsms.get(productId)?.getProduct().name ?? productId,
        userId,
        status: 409,
        message: `DUPLICATE CLICK BLOCKED: In-flight claimId (${existingClaimId}) is already processing.`,
        version: this.fsms.get(productId)?.getProduct().version ?? 1,
      });
      this.notify();
      return {
        success: false,
        claimId: existingClaimId,
        statusCode: 409,
        rolledBack: false,
        error: `Duplicate claim prevented: in-flight lock ${existingClaimId} active.`,
      };
    }

    const fsm = this.fsms.get(productId);
    const claimId = `claim_${productId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (!fsm) {
      return {
        success: false,
        claimId,
        statusCode: 404,
        rolledBack: false,
        error: 'Drop item not found.',
      };
    }

    // 2. Handle expired drop phase
    if (isExpiredPhase) {
      this.metrics.lockTimeouts += 1;
      this.addLog({
        threadId: 'claim-guard',
        action: 'LOCK_TIMEOUT',
        productId,
        productName: fsm.getProduct().name,
        userId,
        status: 408,
        message: `CLAIM EXPIRED: Drop window has already closed for ${claimId}. (408 Timeout)`,
        version: fsm.getProduct().version,
      });
      this.notify();
      return {
        success: false,
        claimId,
        statusCode: 408,
        rolledBack: false,
        error: 'Airdrop claim window has expired (EXPIRED phase).',
      };
    }

    // 3. Register in-flight claimId lock before optimistic state transition
    this.inFlightClaims.set(productId, claimId);
    this.metrics.totalRequests += 1;

    const initialProduct = fsm.getProduct();
    if (initialProduct.availableStock <= 0) {
      this.inFlightClaims.delete(productId);
      this.metrics.conflicts409 += 1;
      this.addLog({
        threadId: 'claim-worker',
        action: 'LOCK_CONFLICT',
        productId,
        productName: initialProduct.name,
        userId,
        status: 409,
        message: `409 LOOTED OUT: Zero remaining stock for ${claimId}. Inventory clamped at 0.`,
        version: initialProduct.version,
      });
      this.verifyInventoryInvariant(productId);
      this.notify();
      return {
        success: false,
        claimId,
        statusCode: 409,
        rolledBack: false,
        error: 'HTTP 409 Conflict: Crate is already LOOTED_OUT (0 stock remaining).',
      };
    }

    // 4. Optimistically decrement displayed inventory via InventoryLockFSM ACQUIRE_LOCK
    const lockRes = fsm.transition({
      type: 'ACQUIRE_LOCK',
      userId,
      userName,
      userType: 'HUMAN',
      leaseDurationMs,
    });

    if (!lockRes.success || !lockRes.lease) {
      this.inFlightClaims.delete(productId);
      this.metrics.conflicts409 += 1;
      this.notify();
      return {
        success: false,
        claimId,
        statusCode: 409,
        rolledBack: false,
        error: lockRes.error ?? 'HTTP 409 Conflict: Looted Out.',
      };
    }

    this.addLog({
      threadId: 'optimistic-ui',
      action: 'LOCK_ATTEMPT',
      productId,
      productName: initialProduct.name,
      userId,
      status: 200,
      message: `OPTIMISTIC DECREMENT [${claimId}]: Stock ${initialProduct.availableStock} -> ${fsm.getProduct().availableStock}. Awaiting server verification...`,
      version: fsm.getProduct().version,
    });
    this.notify();

    // 5. Simulate asynchronous server verification round-trip
    if (latencyMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, latencyMs));
    }

    // 6. Server returns HTTP 409 Conflict (Looted Out race condition) -> Rollback optimistic inventory
    if (simulateConflict409) {
      const stockDuringOptimistic = fsm.getProduct().availableStock;
      fsm.transition({ type: 'RELEASE_LOCK', lockId: lockRes.lease.lockId });
      this.inFlightClaims.delete(productId);
      this.metrics.conflicts409 += 1;

      const restoredProduct = fsm.getProduct();
      this.addLog({
        threadId: 'server-occ',
        action: 'LOCK_CONFLICT',
        productId,
        productName: restoredProduct.name,
        userId,
        status: 409,
        message: `HTTP 409 LOOTED OUT [${claimId}]: Server rejected claim! Automatic rollback restored stock ${stockDuringOptimistic} -> ${restoredProduct.availableStock}.`,
        version: restoredProduct.version,
      });

      this.verifyInventoryInvariant(productId);
      this.notify();
      return {
        success: false,
        claimId,
        statusCode: 409,
        rolledBack: true,
        error: `HTTP 409 Conflict (Looted Out): Server rejected ${claimId}. Optimistic inventory rolled back to ${restoredProduct.availableStock}.`,
      };
    }

    // 7. Server confirms claim (HTTP 200 OK)
    this.inFlightClaims.delete(productId);
    this.metrics.successfulReservations += 1;
    this.addLog({
      threadId: 'server-occ',
      action: 'LOCK_ACQUIRED',
      productId,
      productName: fsm.getProduct().name,
      userId,
      status: 200,
      message: `CLAIM CONFIRMED [${claimId}]: Lease ${lockRes.lease.lockId.slice(0, 14)}... locked for ${leaseDurationMs / 1000}s.`,
      version: fsm.getProduct().version,
    });

    this.verifyInventoryInvariant(productId);
    this.notify();
    return {
      success: true,
      claimId,
      statusCode: 200,
      rolledBack: false,
      lease: lockRes.lease,
    };
  }

  /**
   * Simulates a High-Concurrency Flash Sale Bot Attack.
   * Spawns N concurrent bot workers that simultaneously flood the lock endpoint.
   */
  public async simulateBotFlood(
    productId: string,
    botCount = 50,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{ attempts: number; acquired: number; conflicts: number }> {
    const fsm = this.fsms.get(productId);
    if (!fsm) return { attempts: 0, acquired: 0, conflicts: 0 };

    let acquired = 0;
    let conflicts = 0;

    // Concurrently dispatch requests
    const promises: Promise<void>[] = [];
    for (let i = 0; i < botCount; i++) {
      const threadId = `bot-worker-${(i + 1).toString().padStart(3, '0')}`;
      const botId = `bot_${Math.random().toString(36).slice(2, 8)}`;
      const botName = `AutoSniperBot #${i + 1}`;

      const p = new Promise<void>((resolve) => {
        // Stagger within 0-100ms to simulate hyper-burst network latency
        const jitterMs = Math.floor(Math.random() * 80);
        setTimeout(() => {
          const res = this.reserveItem(productId, botId, botName, 'BOT', 12000, threadId);
          if (res.success && res.lease) {
            acquired++;
            // 75% of successful bots proceed to checkout after 500-1500ms
            if (Math.random() < 0.75) {
              setTimeout(() => {
                this.checkoutOrder(res.lease!.lockId, productId, botName, 'BOT', 'SHOPEEPAY', threadId);
              }, 500 + Math.random() * 1000);
            }
          } else {
            conflicts++;
          }
          if (onProgress) onProgress(acquired + conflicts, botCount);
          resolve();
        }, jitterMs);
      });

      promises.push(p);
    }

    await Promise.all(promises);
    this.notify();
    return { attempts: botCount, acquired, conflicts };
  }

  /**
   * Resets all inventories and clears logs for a fresh stress test.
   */
  public resetInventory(products: ProductInventory[]) {
    this.fsms.forEach((fsm) => fsm.destroy());
    this.fsms.clear();
    products.forEach((p) => {
      this.fsms.set(p.id, new InventoryLockFSM(p));
    });
    this.orders = [];
    this.logs = [];
    this.inFlightClaims.clear();
    this.metrics = {
      totalRequests: 0,
      successfulReservations: 0,
      conflicts409: 0,
      lockTimeouts: 0,
      completedOrders: 0,
      oversellViolations: 0,
      peakRps: 0,
    };
    this.notify();
  }

  public destroy() {
    this.fsms.forEach((fsm) => fsm.destroy());
    this.fsms.clear();
    this.inFlightClaims.clear();
    this.subscribers.clear();
  }
}
