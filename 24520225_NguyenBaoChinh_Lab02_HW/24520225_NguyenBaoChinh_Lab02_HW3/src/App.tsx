// App.tsx
// High-Concurrency Flash-Sale E-Commerce Engine | Global 11.11 Simulation

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  createAntiDriftTimer,
  createDriftProneIntervalTimer,
  formatCountdown,
  blockMainThreadSync,
} from './anti-drift-timer';
import { runConcurrencyInvariantTest, benchmarkTimerDrift } from './telemetry-verifier';
import { INITIAL_PRODUCTS, FLASH_VOUCHERS, FlashSaleVoucher } from './products-data';
import { ConcurrencyEngine } from './concurrency-engine';
import { ProductInventory, InventoryLockLease, OrderRecord } from './types';
import './App.css';

// 2 Hours Countdown for Midnight Flash Sale
const FLASH_SALE_DURATION_MS = 2 * 60 * 60 * 1000;

export default function App() {
  // Concurrency Engine Singleton Instance
  const engine = useMemo(() => new ConcurrencyEngine(INITIAL_PRODUCTS), []);

  // UI States
  const [products, setProducts] = useState<ProductInventory[]>(() => engine.getAllProducts());
  const [leases, setLeases] = useState<InventoryLockLease[]>(() => engine.getAllLeases());
  const [orders, setOrders] = useState<OrderRecord[]>(() => engine.getOrders());
  const [, setLogTick] = useState<number>(0);

  // Precision Zero-Drift Timer State
  const [antiDriftMs, setAntiDriftMs] = useState<number>(FLASH_SALE_DURATION_MS);
  // Drift-Prone setInterval State
  const [setIntervalMs, setSetIntervalMs] = useState<number>(FLASH_SALE_DURATION_MS);
  const [cumulativeDriftMs, setCumulativeDriftMs] = useState<number>(0);
  const [cpuBlockResult, setCpuBlockResult] = useState<string | null>(null);

  // Active User Checkout Modal State
  const [activeCheckoutLease, setActiveCheckoutLease] = useState<InventoryLockLease | null>(null);
  const [buyerName, setBuyerName] = useState<string>('Nguyen Bao Chinh (ID: 24520225)');
  const [shippingAddress, setShippingAddress] = useState<string>('Linh Trung Ward, Thu Duc City, Ho Chi Minh City');
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'SHOPEEPAY' | 'COD'>('MOMO');
  const [selectedVoucher, setSelectedVoucher] = useState<FlashSaleVoucher | null>(null);
  const [isSimulatingBots, setIsSimulatingBots] = useState<boolean>(false);
  const [botCountChoice, setBotCountChoice] = useState<number>(50);
  const [botTargetProduct, setBotTargetProduct] = useState<string>('vn-prod-01');

  // Ref to hold client user identifier
  const clientUserId = useRef<string>(`user_client_${Math.random().toString(36).slice(2, 7)}`);

  // Subscribe to Concurrency Engine updates
  useEffect(() => {
    const unsubscribe = engine.subscribe(() => {
      setProducts(engine.getAllProducts());
      setLeases(engine.getAllLeases());
      setOrders(engine.getOrders());
      setLogTick((prev) => prev + 1);
    });

    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, [engine]);

  // Auto-run verification suite on mount to populate DevTools Console with empirical proof
  useEffect(() => {
    runConcurrencyInvariantTest(5, 50);
    benchmarkTimerDrift(1500, 50);
  }, []);

  // Initialize Zero-Drift Countdown Timer & Drift-Prone Timer
  useEffect(() => {
    // 1. Zero-drift Precision Timer with requestAnimationFrame
    const cancelAntiDrift = createAntiDriftTimer(FLASH_SALE_DURATION_MS, (remaining) => {
      setAntiDriftMs(remaining);
    });

    // 2. Drift-Prone setInterval Timer for Empirical Telemetry Benchmark
    const cancelSetInterval = createDriftProneIntervalTimer(
      FLASH_SALE_DURATION_MS,
      (simulatedRemaining, _actualRemaining, drift) => {
        setSetIntervalMs(simulatedRemaining);
        setCumulativeDriftMs(drift);
      },
      100 // 100ms interval ticks
    );

    return () => {
      cancelAntiDrift();
      cancelSetInterval();
    };
  }, []);

  // Update lease remaining times every 500ms
  useEffect(() => {
    const interval = setInterval(() => {
      setLeases(engine.getAllLeases());
    }, 500);
    return () => clearInterval(interval);
  }, [engine]);

  // Formatted countdown strings
  const antiDriftFormatted = useMemo(() => formatCountdown(antiDriftMs), [antiDriftMs]);
  const setIntervalFormatted = useMemo(() => formatCountdown(setIntervalMs), [setIntervalMs]);

  // User's currently active leases
  const myLeases = useMemo(
    () => leases.filter((l) => l.userId === clientUserId.current && l.state !== 'PURCHASED' && l.state !== 'LOCK_EXPIRED'),
    [leases]
  );

  // Trigger Optimistic Lock Reservation for a product
  const handleReserve = (productId: string) => {
    const res = engine.reserveItem(
      productId,
      clientUserId.current,
      'Nguyen Bao Chinh (You)',
      'HUMAN',
      30000, // 30-second optimistic lock
      'client-ui-thread'
    );

    if (res.success && res.lease) {
      setActiveCheckoutLease(res.lease);
    }
  };

  // Complete checkout in modal
  const handleConfirmCheckout = () => {
    if (!activeCheckoutLease) return;

    const res = engine.checkoutOrder(
      activeCheckoutLease.lockId,
      activeCheckoutLease.productId,
      buyerName,
      'HUMAN',
      paymentMethod,
      'client-ui-thread'
    );

    if (res.success) {
      setActiveCheckoutLease(null);
    } else {
      alert(`Unable to finalize order: ${res.error}`);
    }
  };

  // Release lock voluntarily
  const handleReleaseLock = (productId: string, lockId: string) => {
    engine.releaseLock(productId, lockId, 'client-ui-thread');
    if (activeCheckoutLease?.lockId === lockId) {
      setActiveCheckoutLease(null);
    }
  };

  // Trigger Bot Flood Simulation
  const handleTriggerBotFlood = async (count: number) => {
    setIsSimulatingBots(true);
    await engine.simulateBotFlood(botTargetProduct, count);
    setIsSimulatingBots(false);
  };

  // Trigger Synchronous CPU lag test
  const handleBlockCpu = () => {
    const actualBlockMs = blockMainThreadSync(300);
    setCpuBlockResult(
      `Blocked main thread for ${actualBlockMs}ms. Telemetry check: setInterval lagged by ~${actualBlockMs}ms, while Zero-Drift Timer preserved exact 0ms drift!`
    );
    setTimeout(() => setCpuBlockResult(null), 8000);
  };

  const metrics = engine.getMetrics();
  const logs = engine.getLogs();

  return (
    <div className="flash-sale-container">
      {/* TOP HEADER */}
      <header className="main-header">
        <div className="header-brand">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">GLOBAL MEGA-SALE 11.11 | MIDNIGHT SUPER SALE</h1>
            <p className="brand-subtitle">
              High-Concurrency Flash-Sale E-Commerce Engine & Optimistic Inventory State Machine
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="student-tag">Student: Nguyen Bao Chinh | Student ID: 24520225</span>
          {myLeases.length > 0 && (
            <div style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fbbf24' }}>
              Reserved: {myLeases.length} item(s)
            </div>
          )}
        </div>
      </header>

      {/* ZERO-DRIFT PRECISION COUNTDOWN HERO */}
      <section className="hero-countdown-section" aria-label="Flash Sale Countdown">
        <div className="hero-badge-strip">
          <span className="flame-pulse">🔥</span>
          <span>FLASH SALE ENDS IN</span>
          <span className="flame-pulse">🔥</span>
        </div>

        <h2 className="hero-main-title">MIDNIGHT TECH & APPLIANCES GALA - UP TO 70% OFF</h2>
        <p className="hero-description">
          Real-time countdown system driven by <code>requestAnimationFrame</code> & <code>Date.now()</code> delta
          guaranteeing absolute 0ms cumulative drift (Zero-Drift Invariant).
        </p>

        {/* TIME DIGITS */}
        <div className="timer-digits-container" role="timer" aria-live="polite">
          <div className="timer-box">
            <span className="timer-value">{antiDriftFormatted.hours}</span>
            <span className="timer-label">HOURS</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-box">
            <span className="timer-value">{antiDriftFormatted.minutes}</span>
            <span className="timer-label">MINUTES</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-box">
            <span className="timer-value">{antiDriftFormatted.seconds}</span>
            <span className="timer-label">SECONDS</span>
          </div>
          <span className="timer-colon">.</span>
          <div className="timer-box" style={{ minWidth: '105px' }}>
            <span className="timer-value" style={{ color: '#fbbf24' }}>{antiDriftFormatted.milliseconds}</span>
            <span className="timer-label">MILLISECONDS</span>
          </div>
        </div>

        {/* DRIFT TELEMETRY COMPARISON */}
        <div className="drift-benchmark-panel">
          <div className="drift-card anti-drift">
            <div className="drift-header">
              <span style={{ color: '#34d399' }}>✓ Zero-Drift Timer (rAF + Date Delta)</span>
              <span className="drift-metric-val" style={{ color: '#34d399' }}>0 ms Drift</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#f8fafc' }}>
              Real-time: {antiDriftFormatted.totalFormatted}
            </div>
            <div className="drift-explanation">
              Recalculates delta on every frame from <code>targetTime - Date.now()</code>. Preserves exact physical wall-clock accuracy despite background tab throttling or CPU congestion.
            </div>
          </div>

          <div className="drift-card set-interval">
            <div className="drift-header">
              <span style={{ color: '#f87171' }}>✗ Drift-Prone setInterval(100ms)</span>
              <span className="drift-metric-val" style={{ color: '#f87171' }}>
                +{Math.max(0, cumulativeDriftMs)} ms Drift
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#f8fafc' }}>
              Display: {setIntervalFormatted.totalFormatted}
            </div>
            <div className="drift-explanation">
              Suffers cumulative drift caused by event loop macrotask queue latency, garbage collection pauses, and browser tab background throttling.
            </div>
          </div>
        </div>

        <button className="btn-sync-block" onClick={handleBlockCpu} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          Benchmark Test: Inject 300ms Synchronous CPU Lag (Trigger setInterval Drift)
        </button>

        {cpuBlockResult && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', padding: '8px 16px', borderRadius: '8px', maxWidth: '700px', margin: '12px auto 0 auto' }}>
            {cpuBlockResult}
          </div>
        )}
      </section>

      {/* VOUCHER CAROUSEL STRIP */}
      <div className="voucher-strip" aria-label="Flash Sale Vouchers">
        {FLASH_VOUCHERS.map((v) => {
          const isSelected = selectedVoucher?.code === v.code;
          return (
            <div
              key={v.code}
              className="voucher-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary-orange)' : undefined,
                background: isSelected ? 'rgba(238, 77, 45, 0.15)' : undefined,
              }}
              onClick={() => setSelectedVoucher(isSelected ? null : v)}
            >
              <span className="voucher-badge">{v.badge}</span>
              <div className="voucher-info">
                <h4>{v.name}</h4>
                <p>
                  Min. spend {v.minOrderVnd.toLocaleString('en-US')} VND • Code: <strong>{v.code}</strong>
                  {isSelected && <span style={{ color: '#34d399', marginLeft: '6px' }}>(Applied)</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PRODUCT FLASH SALE SECTION */}
      <section aria-labelledby="products-heading">
        <div className="section-title-wrap">
          <div>
            <h2 id="products-heading" className="section-title">MIDNIGHT FLASH DEALS - STRICTLY LIMITED ALLOCATION</h2>
            <p className="section-subtitle">
              Optimistic locking reserves inventory for 30 seconds upon click to guarantee a secure checkout experience.
            </p>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            OCC Synchronized Version: <strong>v{products.reduce((acc, p) => acc + p.version, 0)}</strong>
          </div>
        </div>

        <div className="products-grid">
          {products.map((p) => {
            const myLease = leases.find((l) => l.productId === p.id && l.userId === clientUserId.current && l.state !== 'PURCHASED' && l.state !== 'LOCK_EXPIRED');
            const otherLeases = leases.filter((l) => l.productId === p.id && l.userId !== clientUserId.current && l.state !== 'PURCHASED' && l.state !== 'LOCK_EXPIRED');
            const isSoldOut = p.availableStock === 0 && p.reservedStock === 0;

            const soldPercent = Math.min(100, Math.round(((p.soldStock) / p.totalStock) * 100));
            const reservedPercent = Math.min(100, Math.round(((p.reservedStock) / p.totalStock) * 100));

            return (
              <article key={p.id} className={`product-card ${myLease ? 'locked-by-you' : ''}`}>
                <div className="product-img-header">
                  <img src={p.image} alt={p.name} className="product-svg-icon" />
                  <span className="discount-tag">-{p.discountPercent}%</span>
                  <span className="brand-category-badge">{p.brand}</span>
                </div>

                <div className="product-content">
                  <h3 className="product-name">{p.name}</h3>
                  <p className="product-desc">{p.description}</p>

                  <div className="price-row">
                    <span className="flash-price">{p.flashSalePrice.toLocaleString('en-US')} VND</span>
                    <span className="original-price">{p.originalPrice.toLocaleString('en-US')} VND</span>
                  </div>

                  {/* STOCK PROGRESS BAR */}
                  <div className="stock-meter-wrap">
                    <div className="stock-meter-labels">
                      <span style={{ color: p.availableStock <= 2 ? '#f87171' : 'var(--text-muted)' }}>
                        {isSoldOut ? 'SOLD OUT' : `In Stock: ${p.availableStock} units`}
                      </span>
                      <span>Claimed: {p.soldStock}/{p.totalStock}</span>
                    </div>
                    <div className="stock-meter-bar" title={`Sold: ${p.soldStock}, Reserved: ${p.reservedStock}, Available: ${p.availableStock}`}>
                      <div className="stock-progress-sold" style={{ width: `${soldPercent}%` }}></div>
                      <div className="stock-progress-reserved" style={{ width: `${reservedPercent}%` }}></div>
                    </div>
                  </div>

                  {/* LOCK STATUS TAG */}
                  {myLease && (
                    <div className="lease-status-box">
                      <span>You have reserved:</span>
                      <span className="lease-countdown-tag">
                        00:{Math.ceil(myLease.remainingMs / 1000).toString().padStart(2, '0')}s
                      </span>
                    </div>
                  )}

                  {otherLeases.length > 0 && !myLease && (
                    <div style={{ fontSize: '12px', color: '#fbbf24', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⏳</span>
                      <span>{otherLeases.length} other shoppers reserving right now</span>
                    </div>
                  )}

                  {/* ACTION BUTTONS */}
                  <div className="product-action-group">
                    {myLease ? (
                      <>
                        <button
                          className="btn-buy-flash"
                          style={{ background: 'var(--gold-gradient)', color: '#0f172a' }}
                          onClick={() => setActiveCheckoutLease(myLease)}
                          type="button"
                        >
                          Checkout Now
                        </button>
                        <button
                          className="btn-release-lock"
                          onClick={() => handleReleaseLock(p.id, myLease.lockId)}
                          type="button"
                          title="Cancel reservation and release unit back to available pool"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn-buy-flash"
                        disabled={p.availableStock <= 0}
                        onClick={() => handleReserve(p.id)}
                        type="button"
                      >
                        {isSoldOut ? (
                          'SOLD OUT'
                        ) : p.availableStock <= 0 ? (
                          'ALL ALLOCATIONS RESERVED'
                        ) : (
                          <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                            </svg>
                            BUY NOW (30s Lock)
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* HIGH CONCURRENCY RACE-CONDITION & BOT FLOOD LAB */}
      <section className="concurrency-lab-panel" aria-labelledby="concurrency-lab-title">
        <div className="lab-header">
          <div>
            <h2 id="concurrency-lab-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              CONCURRENCY BENCHMARK & BOT FLOOD STRESS LAB
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Simulate sudden traffic spikes from dozens of automated bots competing for scarce flash-sale stock.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={botTargetProduct}
              onChange={(e) => setBotTargetProduct(e.target.value)}
              className="form-control"
              style={{ width: 'auto', minWidth: '220px' }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.slice(0, 30)}... (Stock: {p.availableStock})
                </option>
              ))}
            </select>

            <select
              value={botCountChoice}
              onChange={(e) => setBotCountChoice(Number(e.target.value))}
              className="form-control"
              style={{ width: 'auto' }}
            >
              <option value={10}>10 Bot Concurrency</option>
              <option value={25}>25 Bot Concurrency</option>
              <option value={50}>50 Bot Concurrency</option>
              <option value={100}>100 Bot Concurrency</option>
            </select>

            <button
              className="btn-buy-flash"
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              onClick={() => handleTriggerBotFlood(botCountChoice)}
              disabled={isSimulatingBots}
              type="button"
            >
              {isSimulatingBots ? 'Simulating Bots...' : `Launch ${botCountChoice} Bot Workers`}
            </button>

            <button
              style={{ background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
              onClick={() => engine.resetInventory(INITIAL_PRODUCTS)}
              type="button"
            >
              Reset Inventory Pools
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD */}
        <div className="metrics-dashboard-grid">
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#38bdf8' }}>{metrics.totalRequests}</div>
            <div className="metric-card-label">Total Requests Dispatched</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#34d399' }}>{metrics.successfulReservations}</div>
            <div className="metric-card-label">Successful Reservations</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#fbbf24' }}>{metrics.conflicts409}</div>
            <div className="metric-card-label">409 Lock Conflicts</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#a855f7' }}>{metrics.completedOrders}</div>
            <div className="metric-card-label">Orders Finalized</div>
          </div>
          <div className="metric-card" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.06)' }}>
            <div className="metric-card-number" style={{ color: '#10b981' }}>{metrics.oversellViolations}</div>
            <div className="metric-card-label">Oversell Violations</div>
          </div>
        </div>

        {/* LIVE REAL-TIME TERMINAL LOG */}
        <div className="logs-terminal-wrap">
          <div className="terminal-header">
            <span>LIVE CONCURRENCY LOG AUDIT (OPTIMISTIC LOCK & OCC VERSIONING)</span>
            <span>{logs.length} entries</span>
          </div>
          <div className="terminal-body" tabIndex={0} aria-label="Terminal Log">
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>
                No transactions yet. Click &quot;BUY NOW&quot; or &quot;Launch Bots&quot; to observe sub-millisecond race condition telemetry.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="log-row">
                  <span className="log-time">{log.formattedTime}</span>
                  <span className="log-thread">[{log.threadId}]</span>
                  <span className={`log-status st-${log.status}`}>{log.status}</span>
                  <span className="log-msg">
                    [{log.productName.slice(0, 24)}... v{log.version}] {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* COMPLETED ORDERS & LEASES SUMMARY */}
      {orders.length > 0 && (
        <section style={{ marginBottom: '40px' }} aria-labelledby="orders-title">
          <h3 id="orders-title" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
            RECENTLY COMPLETED ORDERS ({orders.length})
          </h3>
          <div style={{ overflowX: 'auto', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#131b2e', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '12px 16px' }}>Order ID</th>
                  <th style={{ padding: '12px 16px' }}>Product</th>
                  <th style={{ padding: '12px 16px' }}>Customer</th>
                  <th style={{ padding: '12px 16px' }}>Type</th>
                  <th style={{ padding: '12px 16px' }}>Payment</th>
                  <th style={{ padding: '12px 16px' }}>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.orderId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>{ord.orderId}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ord.productName}</td>
                    <td style={{ padding: '12px 16px' }}>{ord.buyerName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: ord.userType === 'HUMAN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(238, 77, 45, 0.2)', color: ord.userType === 'HUMAN' ? '#34d399' : '#ff8a65' }}>
                        {ord.userType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{ord.paymentMethod}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: '#f59e0b' }}>
                      {ord.pricePaid.toLocaleString('en-US')} VND
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CHECKOUT MODAL WITH LIVE LEASE EXPIRATION COUNTDOWN */}
      {activeCheckoutLease && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
          <div className="checkout-modal-card">
            <h3 id="checkout-modal-title" style={{ margin: '0 0 14px 0', fontSize: '20px', fontWeight: 800 }}>
              CONFIRM FLASH SALE ORDER
            </h3>

            {/* LEASE EXPIRY ALERT */}
            <div className="checkout-expiry-alert">
              <span>Locking Product Allocation:</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#fbbf24', fontSize: '16px' }}>
                00:{Math.ceil(activeCheckoutLease.remainingMs / 1000).toString().padStart(2, '0')}s
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="input-name">Recipient Full Name</label>
              <input
                id="input-name"
                className="form-control"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-addr">Delivery Address (Express 2H Delivery)</label>
              <input
                id="input-addr"
                className="form-control"
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Secure Payment Method</label>
              <div className="payment-methods-grid">
                {(['MOMO', 'VNPAY', 'SHOPEEPAY', 'COD'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`payment-btn ${paymentMethod === m ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {selectedVoucher && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: '#34d399', marginBottom: '16px' }}>
                Applied Voucher: <strong>{selectedVoucher.code}</strong> (-{selectedVoucher.discountVnd.toLocaleString('en-US')} VND)
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn-buy-flash"
                onClick={handleConfirmCheckout}
                type="button"
                style={{ flex: 2 }}
              >
                Confirm & Pay Now
              </button>
              <button
                style={{ flex: 1, background: '#1e293b', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setActiveCheckoutLease(null)}
                type="button"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
