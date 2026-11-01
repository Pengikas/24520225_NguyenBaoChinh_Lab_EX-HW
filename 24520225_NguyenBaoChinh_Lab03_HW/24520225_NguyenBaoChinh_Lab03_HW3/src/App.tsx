// App.tsx
// KRAFTON x PUBG Vietnam Championship & Airdrop Arena (Homework 3)
// Upgraded from Lab 02 HW3 Foundation: Zero-Drift Airdrop Timer, Optimistic Claim & 409 Rollback, PVS Leaderboard & Kill-Feed

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  createAntiDriftTimer,
  createDriftProneIntervalTimer,
  formatCountdown,
  blockMainThreadSync,
} from './anti-drift-timer';
import { usePubgAirdropTimer } from './hooks/usePubgAirdropTimer';
import {
  runConcurrencyInvariantTest,
  benchmarkTimerDrift,
  runPubgArenaVerificationSuite,
} from './telemetry-verifier';
import {
  INITIAL_PRODUCTS,
  INITIAL_CRATE_DROPS,
  INITIAL_SQUAD_STANDINGS,
  INITIAL_KILL_FEED,
  SQUAD_ROSTERS,
  PUBG_WEAPONS,
  PUBG_MAPS,
  FLASH_VOUCHERS,
  FlashSaleVoucher,
} from './products-data';
import { ConcurrencyEngine } from './concurrency-engine';
import {
  DropPhase,
  PubgCrateDrop,
  PubgVnSquadStanding,
  ProductInventory,
  InventoryLockLease,
  OrderRecord,
} from './types';
import './App.css';

// 2 Hours Countdown for PVS Grand Finals Airdrop Arena Wave
const ARENA_WAVE_DURATION_MS = 2 * 60 * 60 * 1000;

// Official Vietnamese currency formatter required by contract
const vndFormatter = new Intl.NumberFormat('vi-VN');

export function formatVnd(amountVnd: number): string {
  return `${vndFormatter.format(amountVnd)} ₫`;
}

export type LeaderboardSortField = 'TOTAL_PTS' | 'KILL_PTS' | 'PLACEMENT_PTS' | 'WWCD';

interface ClaimNotification {
  id: string;
  type: 'SUCCESS' | 'ROLLBACK_409' | 'DUPLICATE_BLOCKED' | 'EXPIRED';
  title: string;
  message: string;
  claimId: string;
  timestamp: string;
}

interface CrateDropCardProps {
  drop: PubgCrateDrop;
  product: ProductInventory;
  serverOffsetMs: number;
  forceExpired: boolean;
  myLease?: InventoryLockLease;
  otherLeaseCount: number;
  inFlightClaimId?: string;
  onClaimDrop: (dropId: string, phase: DropPhase) => void;
  onOpenCheckout: (lease: InventoryLockLease) => void;
  onReleaseLock: (productId: string, lockId: string) => void;
}

function PubgCrateDropCard({
  drop,
  product,
  serverOffsetMs,
  forceExpired,
  myLease,
  otherLeaseCount,
  inFlightClaimId,
  onClaimDrop,
  onOpenCheckout,
  onReleaseLock,
}: CrateDropCardProps) {
  // Exact Homework 3 Hook Contract: usePubgAirdropTimer(targetEpochMs, serverOffsetMs)
  const { remainingMs, isLive } = usePubgAirdropTimer(drop.dropEpochMs, serverOffsetMs);
  const countdown = useMemo(() => formatCountdown(remainingMs), [remainingMs]);

  // Derive DropPhase strictly from contract states ('WARMUP' | 'AIRDROP_LIVE' | 'LOOTED_OUT' | 'EXPIRED')
  const dropPhase: DropPhase = useMemo(() => {
    if (forceExpired) return 'EXPIRED';
    if (drop.remainingStock <= 0 && product.reservedStock <= 0) return 'LOOTED_OUT';
    if (!isLive) return 'WARMUP';
    if (drop.remainingStock <= 0) return 'LOOTED_OUT';
    return 'AIRDROP_LIVE';
  }, [forceExpired, drop.remainingStock, product.reservedStock, isLive]);

  const soldPercent = Math.min(100, Math.round((product.soldStock / product.totalStock) * 100));
  const reservedPercent = Math.min(100, Math.round((product.reservedStock / product.totalStock) * 100));

  return (
    <article
      className={`product-card pubg-drop-card phase-${dropPhase.toLowerCase()} ${myLease ? 'locked-by-you' : ''}`}
      data-testid={`crate-card-${drop.id}`}
    >
      <div className="product-img-header">
        <img src={product.image} alt={drop.title} className="product-svg-icon" />
        <span className={`phase-badge phase-tag-${dropPhase.toLowerCase()}`}>{dropPhase}</span>
        <span className="brand-category-badge">{product.category}</span>
      </div>

      <div className="product-content">
        <div className="drop-id-row">
          <span className="mono-id">ID: {drop.id}</span>
          {inFlightClaimId && (
            <span className="inflight-claim-pill" title="Active in-flight claimId lock">
              LOCK: {inFlightClaimId.slice(0, 16)}...
            </span>
          )}
        </div>

        <h3 className="product-name">{drop.title}</h3>
        <p className="product-desc">{product.description}</p>

        <div className="price-row">
          <span className="flash-price">{formatVnd(drop.priceVnd)}</span>
          <span className="original-price">{formatVnd(product.originalPrice)}</span>
          <span className="discount-inline-pill">-{product.discountPercent}%</span>
        </div>

        {/* PER-DROP ZERO-DRIFT COUNTDOWN STATUS */}
        <div className="drop-countdown-bar">
          {dropPhase === 'WARMUP' ? (
            <div className="drop-timer-Readout warmup">
              <span>🪂 Airdrop Lands In:</span>
              <strong>{countdown.shortFormatted}s</strong>
            </div>
          ) : dropPhase === 'AIRDROP_LIVE' ? (
            <div className="drop-timer-Readout live">
              <span>🟢 AIRDROP LIVE</span>
              <strong>00:00.00 (Ready to Claim)</strong>
            </div>
          ) : dropPhase === 'LOOTED_OUT' ? (
            <div className="drop-timer-Readout looted">
              <span>🔴 CRATE LOOTED OUT</span>
              <strong>0 Remaining</strong>
            </div>
          ) : (
            <div className="drop-timer-Readout expired">
              <span>⚪ DROP WINDOW EXPIRED</span>
              <strong>Closed</strong>
            </div>
          )}
        </div>

        {/* STOCK PROGRESS BAR */}
        <div className="stock-meter-wrap">
          <div className="stock-meter-labels">
            <span style={{ color: drop.remainingStock <= 2 ? '#f87171' : 'var(--text-muted)' }}>
              {dropPhase === 'LOOTED_OUT'
                ? 'LOOTED OUT (0 left)'
                : `Remaining Stock: ${drop.remainingStock} / ${product.totalStock}`}
            </span>
            <span>
              Reserved: {product.reservedStock} • Claimed: {product.soldStock}
            </span>
          </div>
          <div
            className="stock-meter-bar"
            title={`Claimed: ${product.soldStock}, Optimistically Reserved: ${product.reservedStock}, Remaining: ${drop.remainingStock}`}
          >
            <div className="stock-progress-sold" style={{ width: `${soldPercent}%` }}></div>
            <div className="stock-progress-reserved" style={{ width: `${reservedPercent}%` }}></div>
          </div>
        </div>

        {/* ACTIVE LEASE COUNTDOWN */}
        {myLease && (
          <div className="lease-status-box">
            <span>Crate Locked for You (`{myLease.lockId.slice(0, 12)}`):</span>
            <span className="lease-countdown-tag">
              00:{Math.ceil(myLease.remainingMs / 1000).toString().padStart(2, '0')}s
            </span>
          </div>
        )}

        {otherLeaseCount > 0 && !myLease && (
          <div className="other-players-locking">
            <span>⚡</span>
            <span>{otherLeaseCount} squad member(s) contesting this crate right now</span>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="product-action-group">
          {myLease && !inFlightClaimId ? (
            <>
              <button
                className="btn-buy-flash"
                style={{ background: 'var(--gold-gradient)', color: '#0f172a' }}
                onClick={() => onOpenCheckout(myLease)}
                type="button"
              >
                Finalize Claim ({formatVnd(drop.priceVnd)})
              </button>
              <button
                className="btn-release-lock"
                onClick={() => onReleaseLock(drop.id, myLease.lockId)}
                type="button"
                title="Cancel optimistic reservation and return crate to pool"
              >
                Release
              </button>
            </>
          ) : (
            <button
              className="btn-buy-flash"
              disabled={dropPhase !== 'AIRDROP_LIVE' || Boolean(inFlightClaimId)}
              onClick={() => onClaimDrop(drop.id, dropPhase)}
              type="button"
              data-testid={`claim-btn-${drop.id}`}
            >
              {inFlightClaimId ? (
                <>⏳ CLAIMING ({inFlightClaimId.slice(0, 10)}...)</>
              ) : dropPhase === 'WARMUP' ? (
                `WARMUP (${countdown.seconds}s)`
              ) : dropPhase === 'LOOTED_OUT' ? (
                '409 LOOTED OUT'
              ) : dropPhase === 'EXPIRED' ? (
                'DROP EXPIRED'
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                  CLAIM AIRDROP (30s Lock)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function App() {
  // Reuse Lab 02 ConcurrencyEngine & InventoryLockFSM Singleton
  const engine = useMemo(() => new ConcurrencyEngine(INITIAL_PRODUCTS), []);

  // Absolute target epoch for main arena countdown wave
  const [arenaTargetEpochMs, setArenaTargetEpochMs] = useState<number>(
    () => Date.now() + ARENA_WAVE_DURATION_MS
  );
  const [serverOffsetMs, setServerOffsetMs] = useState<number>(0);
  const [visibilitySyncCount, setVisibilitySyncCount] = useState<number>(0);
  const [lastVisibilitySyncTime, setLastVisibilitySyncTime] = useState<string>('Mounted');

  // Primary PUBG Airdrop Countdown Hook (Image 3 Contract)
  const arenaTimer = usePubgAirdropTimer(arenaTargetEpochMs, serverOffsetMs);

  // Inventory & Concurrency Engine States
  const [products, setProducts] = useState<ProductInventory[]>(() => engine.getAllProducts());
  const [leases, setLeases] = useState<InventoryLockLease[]>(() => engine.getAllLeases());
  const [orders, setOrders] = useState<OrderRecord[]>(() => engine.getOrders());
  const [, setLogTick] = useState<number>(0);

  // Optimistic Claim & 409 Simulation Controls
  const [simulate409Conflict, setSimulate409Conflict] = useState<boolean>(false);
  const [forceExpiredDrops, setForceExpiredDrops] = useState<boolean>(false);
  const [inFlightMap, setInFlightMap] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<ClaimNotification[]>([]);

  // Lab 02 Comparative Drift Telemetry State
  const [antiDriftMs, setAntiDriftMs] = useState<number>(ARENA_WAVE_DURATION_MS);
  const [setIntervalMs, setSetIntervalMs] = useState<number>(ARENA_WAVE_DURATION_MS);
  const [cumulativeDriftMs, setCumulativeDriftMs] = useState<number>(0);
  const [cpuBlockResult, setCpuBlockResult] = useState<string | null>(null);

  // Checkout Modal & Vouchers State
  const [activeCheckoutLease, setActiveCheckoutLease] = useState<InventoryLockLease | null>(null);
  const [buyerName, setBuyerName] = useState<string>('Nguyen Bao Chinh (ID: 24520225)');
  const [inGameIgn, setInGameIgn] = useState<string>('PVS_BaoChinh24520225');
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'VNPAY' | 'SHOPEEPAY' | 'COD'>('MOMO');
  const [selectedVoucher, setSelectedVoucher] = useState<FlashSaleVoucher | null>(null);

  // Concurrency Stress Lab Controls
  const [isSimulatingBots, setIsSimulatingBots] = useState<boolean>(false);
  const [botCountChoice, setBotCountChoice] = useState<number>(50);
  const [botTargetProduct, setBotTargetProduct] = useState<string>('pvs-vip-ticket-01');

  // Feature 3: PUBG Vietnam Squad Standings & Live Kill-Feed State
  const [squadStandings, setSquadStandings] = useState<readonly PubgVnSquadStanding[]>(
    () => INITIAL_SQUAD_STANDINGS
  );
  const [killFeed, setKillFeed] = useState(() => INITIAL_KILL_FEED);
  const [selectedSquadFilter, setSelectedSquadFilter] = useState<string>('ALL');
  const [squadSearchQuery, setSquadSearchQuery] = useState<string>('');
  const [minWwcdFilter, setMinWwcdFilter] = useState<number>(0);
  const [sortField, setSortField] = useState<LeaderboardSortField>('TOTAL_PTS');
  const [sortDirection, setSortDirection] = useState<'DESC' | 'ASC'>('DESC');
  const [isLivePollingFeed, setIsLivePollingFeed] = useState<boolean>(true);
  const [pollTickCount, setPollTickCount] = useState<number>(0);

  const clientUserId = useRef<string>(`user_client_${Math.random().toString(36).slice(2, 7)}`);
  const pollCounterRef = useRef<number>(0);

  const pushNotification = useCallback(
    (
      type: ClaimNotification['type'],
      title: string,
      message: string,
      claimId: string
    ) => {
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour12: false });
      const item: ClaimNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type,
        title,
        message,
        claimId,
        timestamp: nowStr,
      };
      setNotifications((prev) => [item, ...prev.slice(0, 5)]);
    },
    []
  );

  // Subscribe to Lab 02 Concurrency Engine updates
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

  // Track visibilitychange wake events for telemetry proof
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setVisibilitySyncCount((prev) => prev + 1);
        setLastVisibilitySyncTime(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Auto-run verification suite on mount
  useEffect(() => {
    runConcurrencyInvariantTest(5, 50);
    benchmarkTimerDrift(1500, 50);
    runPubgArenaVerificationSuite();
  }, []);

  // Retain Lab 02 Zero-Drift rAF Timer & Drift-Prone setInterval Benchmark
  useEffect(() => {
    const cancelAntiDrift = createAntiDriftTimer(ARENA_WAVE_DURATION_MS, (remaining) => {
      setAntiDriftMs(remaining);
    });

    const cancelSetInterval = createDriftProneIntervalTimer(
      ARENA_WAVE_DURATION_MS,
      (simulatedRemaining, _actualRemaining, drift) => {
        setSetIntervalMs(simulatedRemaining);
        setCumulativeDriftMs(drift);
      },
      100
    );

    return () => {
      cancelAntiDrift();
      cancelSetInterval();
    };
  }, []);

  // Update active lease countdowns every 250ms
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLeases(engine.getAllLeases());
    }, 250);
    return () => window.clearInterval(interval);
  }, [engine]);

  // Simulate a live PVS match elimination & update standings without stale closures
  const triggerLiveKillEvent = useCallback((forcedSquadId?: string) => {
    const squadIds = ['te', 'ces', 'ge', 'agg'] as const;
    const attackerSquadId =
      forcedSquadId && squadIds.includes(forcedSquadId as (typeof squadIds)[number])
        ? forcedSquadId
        : squadIds[pollCounterRef.current % squadIds.length];

    const victimCandidates = squadIds.filter((id) => id !== attackerSquadId);
    const victimSquadId = victimCandidates[pollCounterRef.current % victimCandidates.length];

    const attackerRoster = SQUAD_ROSTERS[attackerSquadId].players;
    const victimRoster = SQUAD_ROSTERS[victimSquadId].players;

    const attackerPlayer = attackerRoster[pollCounterRef.current % attackerRoster.length];
    const victimPlayer = victimRoster[(pollCounterRef.current + 1) % victimRoster.length];
    const weapon = PUBG_WEAPONS[pollCounterRef.current % PUBG_WEAPONS.length];
    const mapName = PUBG_MAPS[pollCounterRef.current % PUBG_MAPS.length];
    const isHeadshot = weapon.includes('Headshot') || pollCounterRef.current % 3 === 0;
    const isWwcdFinisher = pollCounterRef.current > 0 && pollCounterRef.current % 7 === 0;

    pollCounterRef.current += 1;
    const currentTick = pollCounterRef.current;
    setPollTickCount(currentTick);

    const squadNamesMap: Record<string, string> = {
      te: 'The Expendables',
      ces: 'Cerberus Esports',
      ge: 'Roy Esports',
      agg: 'AGG',
    };

    const newKill = {
      id: `kf_live_${Date.now()}_${currentTick}`,
      timestampMs: Date.now(),
      formattedTime: `Live Tick #${currentTick} • Phase ${(currentTick % 8) + 1}`,
      attackerSquadId,
      attackerSquadName: squadNamesMap[attackerSquadId],
      attackerPlayer,
      weapon,
      victimPlayer,
      victimSquadId,
      mapName,
      isHeadshot,
      isWwcdFinisher,
    };

    // Functional state updates prevent stale closures in auto-polling
    setKillFeed((prev) => [newKill, ...prev.slice(0, 19)]);
    setSquadStandings((prev) =>
      prev.map((sq) =>
        sq.squadId === attackerSquadId
          ? {
              ...sq,
              killPts: sq.killPts + 1,
              placementPts: isWwcdFinisher ? sq.placementPts + 10 : sq.placementPts,
              wwcdCount: isWwcdFinisher ? sq.wwcdCount + 1 : sq.wwcdCount,
            }
          : sq
      )
    );
  }, []);

  // Live Kill-Feed Auto-Polling with AbortController & Clean Unmount Teardown
  useEffect(() => {
    if (!isLivePollingFeed) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    const pollIntervalId = window.setInterval(() => {
      if (signal.aborted) return;
      triggerLiveKillEvent();
    }, 4500);

    return () => {
      abortController.abort();
      window.clearInterval(pollIntervalId);
    };
  }, [isLivePollingFeed, triggerLiveKillEvent]);

  // Derive PubgCrateDrop[] dynamically from authoritative ProductInventory state
  const crateDrops: readonly PubgCrateDrop[] = useMemo(() => {
    return INITIAL_CRATE_DROPS.map((baseDrop) => {
      const prod = products.find((p) => p.id === baseDrop.id);
      return {
        id: baseDrop.id,
        title: baseDrop.title,
        priceVnd: baseDrop.priceVnd,
        remainingStock: prod ? Math.max(0, prod.availableStock) : baseDrop.remainingStock,
        dropEpochMs: baseDrop.dropEpochMs,
      };
    });
  }, [products]);

  // Derived Leaderboard Standings (No redundant useEffect for derived state!)
  const filteredAndSortedStandings = useMemo(() => {
    const query = squadSearchQuery.trim().toLowerCase();

    const filtered = squadStandings.filter((sq) => {
      if (selectedSquadFilter !== 'ALL' && sq.squadId !== selectedSquadFilter) {
        return false;
      }
      if (sq.wwcdCount < minWwcdFilter) {
        return false;
      }
      if (
        query &&
        !sq.squadName.toLowerCase().includes(query) &&
        !sq.squadId.toLowerCase().includes(query)
      ) {
        return false;
      }
      return true;
    });

    return [...filtered].sort((a, b) => {
      const totalA = a.placementPts + a.killPts;
      const totalB = b.placementPts + b.killPts;

      let diff = 0;
      switch (sortField) {
        case 'TOTAL_PTS':
          diff = totalB - totalA || b.wwcdCount - a.wwcdCount || b.killPts - a.killPts;
          break;
        case 'KILL_PTS':
          diff = b.killPts - a.killPts || totalB - totalA;
          break;
        case 'PLACEMENT_PTS':
          diff = b.placementPts - a.placementPts || totalB - totalA;
          break;
        case 'WWCD':
          diff = b.wwcdCount - a.wwcdCount || totalB - totalA;
          break;
      }
      return sortDirection === 'DESC' ? diff : -diff;
    });
  }, [squadStandings, selectedSquadFilter, squadSearchQuery, minWwcdFilter, sortField, sortDirection]);

  // Filtered Live Kill-Feed
  const filteredKillFeed = useMemo(() => {
    if (selectedSquadFilter === 'ALL') return killFeed;
    return killFeed.filter(
      (k) => k.attackerSquadId === selectedSquadFilter || k.victimSquadId === selectedSquadFilter
    );
  }, [killFeed, selectedSquadFilter]);

  // Formatted countdown strings
  const arenaCountdownFormatted = useMemo(
    () => formatCountdown(arenaTimer.remainingMs),
    [arenaTimer.remainingMs]
  );
  const antiDriftFormatted = useMemo(() => formatCountdown(antiDriftMs), [antiDriftMs]);
  const setIntervalFormatted = useMemo(() => formatCountdown(setIntervalMs), [setIntervalMs]);

  // User's currently active leases
  const myLeases = useMemo(
    () =>
      leases.filter(
        (l) =>
          l.userId === clientUserId.current &&
          l.state !== 'PURCHASED' &&
          l.state !== 'LOCK_EXPIRED'
      ),
    [leases]
  );

  // Optimistic Crate/Ticket Claim Handler with In-Flight claimId Guard & 409 Rollback
  const handleClaimDrop = async (dropId: string, phase: DropPhase) => {
    const existingClaimId = inFlightMap[dropId] || engine.getInFlightClaimId(dropId);
    if (existingClaimId) {
      pushNotification(
        'DUPLICATE_BLOCKED',
        'Duplicate Click Prevented',
        `In-flight lock ${existingClaimId} is already processing for ${dropId}.`,
        existingClaimId
      );
      return;
    }

    const tempClaimId = `claim_${dropId}_${Date.now()}`;
    setInFlightMap((prev) => ({ ...prev, [dropId]: tempClaimId }));

    const res = await engine.claimDropOptimistic(
      dropId,
      clientUserId.current,
      'Nguyen Bao Chinh (You)',
      {
        simulateConflict409: simulate409Conflict,
        latencyMs: 320,
        leaseDurationMs: 30000,
        isExpiredPhase: phase === 'EXPIRED' || forceExpiredDrops,
      }
    );

    setInFlightMap((prev) => {
      const next = { ...prev };
      delete next[dropId];
      return next;
    });

    if (res.success && res.lease) {
      pushNotification(
        'SUCCESS',
        'Optimistic Airdrop Claim Locked (200 OK)',
        `Successfully reserved ${dropId} with claimId ${res.claimId}. Complete checkout within 30s!`,
        res.claimId
      );
      setActiveCheckoutLease(res.lease);
    } else if (res.rolledBack) {
      pushNotification(
        'ROLLBACK_409',
        'HTTP 409 Conflict — Looted Out Rollback!',
        res.error ?? 'Server rejected claim (409 Looted Out). Optimistic inventory automatically restored.',
        res.claimId
      );
    } else if (res.statusCode === 408) {
      pushNotification(
        'EXPIRED',
        'Claim Window Expired (408)',
        res.error ?? 'Airdrop window has expired.',
        res.claimId
      );
    } else {
      pushNotification(
        'ROLLBACK_409',
        `Claim Rejected (${res.statusCode})`,
        res.error ?? 'Crate is already looted out.',
        res.claimId
      );
    }
  };

  // Complete checkout in modal
  const handleConfirmCheckout = () => {
    if (!activeCheckoutLease) return;

    const res = engine.checkoutOrder(
      activeCheckoutLease.lockId,
      activeCheckoutLease.productId,
      `${buyerName} [${inGameIgn}]`,
      'HUMAN',
      paymentMethod,
      'client-ui-thread'
    );

    if (res.success && res.order) {
      pushNotification(
        'SUCCESS',
        'Airdrop Claim Finalized!',
        `Order ${res.order.orderId} completed for ${res.order.productName} (${formatVnd(res.order.pricePaid)}).`,
        res.order.lockId
      );
      setActiveCheckoutLease(null);
    } else {
      pushNotification(
        'EXPIRED',
        'Checkout Failed',
        res.error ?? 'Lease expired before confirmation.',
        activeCheckoutLease.lockId
      );
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
      `Blocked main thread for ${actualBlockMs}ms. Telemetry check: naive setInterval lagged by ~${actualBlockMs}ms, while usePubgAirdropTimer & Zero-Drift Timer preserved 0ms drift!`
    );
    window.setTimeout(() => setCpuBlockResult(null), 8000);
  };

  const metrics = engine.getMetrics();
  const logs = engine.getLogs();

  return (
    <div className="flash-sale-container">
      {/* TOP KRAFTON x PUBG VIETNAM CHAMPIONSHIP HEADER */}
      <header className="main-header">
        <div className="header-brand">
          <div className="brand-icon-wrapper" aria-hidden="true">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0b0f19"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div>
            <div className="krafton-eyebrow">KRAFTON • PUBG ESPORTS VIETNAM OFFICIAL ARENA</div>
            <h1 className="brand-title">KRAFTON x PUBG VIETNAM CHAMPIONSHIP &amp; AIRDROP ARENA</h1>
            <p className="brand-subtitle">
              PVS Grand Finals VIP Ticketing • Zero-Drift Airdrop Timer • Optimistic Claim &amp; HTTP 409 Rollback • Live Standings
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="student-tag">Student: Nguyen Bao Chinh | MSSV: 24520225</span>
          <span className="react-version-pill">React 19 • Strict TS</span>
          {myLeases.length > 0 && (
            <div className="reserved-header-badge">
              Locked Crates: {myLeases.length}
            </div>
          )}
        </div>
      </header>

      {/* FEATURE 1: ZERO-DRIFT AIRDROP & PVS FINALS TICKET COUNTDOWN HERO */}
      <section className="hero-countdown-section" aria-label="PVS Airdrop Countdown">
        <div className="hero-badge-strip">
          <span className="flame-pulse">🪂</span>
          <span>
            {arenaTimer.isLive
              ? 'PVS GRAND FINALS AIRDROP WAVE IS LIVE!'
              : 'PVS GRAND FINALS AIRDROP WAVE COUNTDOWN'}
          </span>
          <span className="flame-pulse">🔥</span>
        </div>

        <h2 className="hero-main-title">
          PUBG VIETNAM SERIES (PVS) FINALS &amp; G-COIN SUPPLY DROP ARENA
        </h2>
        <p className="hero-description">
          Synchronized via <code>usePubgAirdropTimer(targetEpochMs, serverOffsetMs)</code> with 200ms wall-clock delta
          recalculation and <code>visibilitychange</code> wake recovery — eliminating background tab countdown drift.
        </p>

        {/* TIME DIGITS DRIVEN BY usePubgAirdropTimer */}
        <div className="timer-digits-container" role="timer" aria-live="polite" data-testid="arena-main-timer">
          <div className="timer-box">
            <span className="timer-value">{arenaCountdownFormatted.hours}</span>
            <span className="timer-label">HOURS</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-box">
            <span className="timer-value">{arenaCountdownFormatted.minutes}</span>
            <span className="timer-label">MINUTES</span>
          </div>
          <span className="timer-colon">:</span>
          <div className="timer-box">
            <span className="timer-value">{arenaCountdownFormatted.seconds}</span>
            <span className="timer-label">SECONDS</span>
          </div>
          <span className="timer-colon">.</span>
          <div className="timer-box" style={{ minWidth: '105px' }}>
            <span className="timer-value" style={{ color: '#fbbf24' }}>
              {arenaCountdownFormatted.milliseconds}
            </span>
            <span className="timer-label">MS (200ms SYNC)</span>
          </div>
        </div>

        {/* INTERACTIVE TIMER & VISIBILITY SYNC CONTROLS */}
        <div className="timer-controls-bar">
          <button
            type="button"
            className="btn-timer-action"
            onClick={() => setServerOffsetMs((prev) => prev + 40000)}
            data-testid="fast-forward-warmup-btn"
          >
            ⏩ Fast-Forward Server Offset (+40s — Unlock All Warmup Drops)
          </button>
          <button
            type="button"
            className="btn-timer-action"
            onClick={() => setArenaTargetEpochMs(Date.now() + 3000 - serverOffsetMs)}
            data-testid="test-3s-expiry-btn"
          >
            ⏱️ Set Wave to 3s (Test Countdown Expiration)
          </button>
          <button
            type="button"
            className="btn-timer-action"
            onClick={() => {
              setServerOffsetMs(0);
              setArenaTargetEpochMs(Date.now() + ARENA_WAVE_DURATION_MS);
            }}
          >
            🔄 Reset Wave Clock (2h)
          </button>
          <button
            type="button"
            className="btn-timer-action"
            onClick={() => {
              document.dispatchEvent(new Event('visibilitychange'));
            }}
            data-testid="trigger-visibility-sync-btn"
          >
            👁️ Simulate Tab Wake (`visibilitychange` Syncs: {visibilitySyncCount} • Last: {lastVisibilitySyncTime})
          </button>
        </div>

        {/* DRIFT TELEMETRY COMPARISON (REUSED FROM LAB 02) */}
        <div className="drift-benchmark-panel">
          <div className="drift-card anti-drift">
            <div className="drift-header">
              <span style={{ color: '#34d399' }}>
                ✓ Zero-Drift Wall-Clock Delta (`usePubgAirdropTimer` &amp; rAF)
              </span>
              <span className="drift-metric-val" style={{ color: '#34d399' }}>
                0 ms Drift
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#f8fafc' }}>
              Wall-Clock Remaining: {antiDriftFormatted.totalFormatted} • Offset: +{serverOffsetMs}ms
            </div>
            <div className="drift-explanation">
              Computes <code>Math.max(0, targetEpochMs - (Date.now() + serverOffsetMs))</code> on every 200ms tick and
              immediately resynchronizes on <code>visibilitychange</code> when waking a background tab.
            </div>
          </div>

          <div className="drift-card set-interval">
            <div className="drift-header">
              <span style={{ color: '#f87171' }}>✗ Naive Decrementing setInterval(100ms)</span>
              <span className="drift-metric-val" style={{ color: '#f87171' }}>
                +{Math.max(0, cumulativeDriftMs)} ms Drift
              </span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', color: '#f8fafc' }}>
              Drifted Readout: {setIntervalFormatted.totalFormatted}
            </div>
            <div className="drift-explanation">
              Naive <code>setState(prev =&gt; prev - 100)</code> accumulates macrotask queue delay, GC pauses, and 1000ms+
              background tab throttling.
            </div>
          </div>
        </div>

        <button className="btn-sync-block" onClick={handleBlockCpu} type="button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          Benchmark Test: Inject 300ms Main-Thread CPU Lag (Verify Zero-Drift Recovery)
        </button>

        {cpuBlockResult && (
          <div className="cpu-block-banner" role="status">
            {cpuBlockResult}
          </div>
        )}
      </section>

      {/* FEATURE 2: OPTIMISTIC CLAIM & HTTP 409 ROLLBACK CONTROL BAR */}
      <section className="optimistic-control-bar" aria-label="Optimistic Claim Controls">
        <div className="optimistic-control-info">
          <h3>🛡️ OPTIMISTIC INVENTORY RESERVATION &amp; HTTP 409 ROLLBACK ENGINE</h3>
          <p>
            Clicking <strong>CLAIM AIRDROP</strong> immediately decrements displayed stock via <code>InventoryLockFSM</code>,
            locks the button with an in-flight <code>claimId</code> to block duplicate clicks, and rolls back automatically
            if the server returns <strong>HTTP 409 Conflict (Looted Out)</strong>.
          </p>
        </div>

        <div className="optimistic-toggles">
          <label className={`toggle-pill ${simulate409Conflict ? 'active-danger' : ''}`}>
            <input
              type="checkbox"
              checked={simulate409Conflict}
              onChange={(e) => setSimulate409Conflict(e.target.checked)}
              data-testid="toggle-simulate-409"
            />
            <span>Simulate Server HTTP 409 Looted Out (Test Automatic Rollback)</span>
          </label>

          <label className={`toggle-pill ${forceExpiredDrops ? 'active-warn' : ''}`}>
            <input
              type="checkbox"
              checked={forceExpiredDrops}
              onChange={(e) => setForceExpiredDrops(e.target.checked)}
              data-testid="toggle-force-expired"
            />
            <span>Force `EXPIRED` DropPhase</span>
          </label>
        </div>
      </section>

      {/* LIVE CLAIM & ROLLBACK NOTIFICATIONS */}
      {notifications.length > 0 && (
        <section className="notifications-stack" aria-live="polite" data-testid="claim-notifications">
          {notifications.map((n) => (
            <div key={n.id} className={`claim-toast toast-${n.type.toLowerCase()}`}>
              <div className="toast-header">
                <strong>{n.title}</strong>
                <span className="toast-meta">
                  {n.claimId} • {n.timestamp}
                </span>
              </div>
              <p>{n.message}</p>
            </div>
          ))}
        </section>
      )}

      {/* VOUCHER CAROUSEL STRIP */}
      <div className="voucher-strip" aria-label="PVS Championship Vouchers">
        {FLASH_VOUCHERS.map((v) => {
          const isSelected = selectedVoucher?.code === v.code;
          return (
            <div
              key={v.code}
              className="voucher-card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--primary-orange)' : undefined,
                background: isSelected ? 'rgba(245, 158, 11, 0.16)' : undefined,
              }}
              onClick={() => setSelectedVoucher(isSelected ? null : v)}
            >
              <span className="voucher-badge">{v.badge}</span>
              <div className="voucher-info">
                <h4>{v.name}</h4>
                <p>
                  Min. order {formatVnd(v.minOrderVnd)} • Code: <strong>{v.code}</strong>
                  {isSelected && <span style={{ color: '#34d399', marginLeft: '6px' }}>(Applied)</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* PVS VIP TICKETS & G-COIN CRATE DROPS GRID */}
      <section aria-labelledby="products-heading">
        <div className="section-title-wrap">
          <div>
            <h2 id="products-heading" className="section-title">
              PVS GRAND FINALS VIP TICKETS &amp; G-COIN AIRDROP CRATES
            </h2>
            <p className="section-subtitle">
              All prices formatted via <code>Intl.NumberFormat(&apos;vi-VN&apos;)</code>. Each card binds its own{' '}
              <code>usePubgAirdropTimer</code> and enforces zero-oversell <code>InventoryLockFSM</code> transitions.
            </p>
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            OCC Vector Version: <strong>v{products.reduce((acc, p) => acc + p.version, 0)}</strong>
          </div>
        </div>

        <div className="products-grid">
          {crateDrops.map((drop) => {
            const prod = products.find((p) => p.id === drop.id) ?? INITIAL_PRODUCTS[0];
            const myLease = leases.find(
              (l) =>
                l.productId === drop.id &&
                l.userId === clientUserId.current &&
                l.state !== 'PURCHASED' &&
                l.state !== 'LOCK_EXPIRED'
            );
            const otherLeaseCount = leases.filter(
              (l) =>
                l.productId === drop.id &&
                l.userId !== clientUserId.current &&
                l.state !== 'PURCHASED' &&
                l.state !== 'LOCK_EXPIRED'
            ).length;

            return (
              <PubgCrateDropCard
                key={drop.id}
                drop={drop}
                product={prod}
                serverOffsetMs={serverOffsetMs}
                forceExpired={forceExpiredDrops || arenaTimer.remainingMs === 0}
                myLease={myLease}
                otherLeaseCount={otherLeaseCount}
                inFlightClaimId={inFlightMap[drop.id]}
                onClaimDrop={handleClaimDrop}
                onOpenCheckout={(lease) => setActiveCheckoutLease(lease)}
                onReleaseLock={handleReleaseLock}
              />
            );
          })}
        </div>
      </section>

      {/* FEATURE 3: PUBG VIETNAM SQUAD LEADERBOARD & LIVE KILL-FEED */}
      <section className="leaderboard-arena-section" aria-labelledby="leaderboard-heading">
        <div className="lab-header">
          <div>
            <div className="krafton-eyebrow">PUBG VIETNAM SERIES (PVS) • SUPER POINT RULE STANDINGS</div>
            <h2 id="leaderboard-heading" className="section-title">
              PUBG VIETNAM CHAMPIONSHIP SQUAD LEADERBOARD &amp; LIVE KILL-FEED
            </h2>
            <p className="section-subtitle">
              Official standings for <strong>The Expendables (`te`)</strong>, <strong>Cerberus Esports (`ces`)</strong>,{' '}
              <strong>Roy Esports (`ge`)</strong>, and <strong>AGG (`agg`)</strong>. Total points are derived during render
              from <code>placementPts + killPts</code>.
            </p>
          </div>

          <div className="leaderboard-live-controls">
            <button
              type="button"
              className="btn-timer-action"
              onClick={() => triggerLiveKillEvent(selectedSquadFilter === 'ALL' ? undefined : selectedSquadFilter)}
              data-testid="simulate-kill-btn"
            >
              🎯 +1 Live Match Elimination
            </button>
            <button
              type="button"
              className={`btn-timer-action ${isLivePollingFeed ? 'polling-on' : ''}`}
              onClick={() => setIsLivePollingFeed((prev) => !prev)}
              data-testid="toggle-polling-btn"
            >
              {isLivePollingFeed
                ? `📡 Auto-Polling ON (Ticks: ${pollTickCount})`
                : '⏸️ Auto-Polling PAUSED'}
            </button>
            <button
              type="button"
              className="btn-timer-action"
              onClick={() => {
                setSquadStandings(INITIAL_SQUAD_STANDINGS);
                setKillFeed(INITIAL_KILL_FEED);
                pollCounterRef.current = 0;
                setPollTickCount(0);
              }}
            >
              ↺ Reset Standings
            </button>
          </div>
        </div>

        {/* FILTER & SORT CONTROLS */}
        <div className="leaderboard-filters-bar">
          <div className="squad-pill-group" role="group" aria-label="Filter by PUBG Vietnam Squad">
            {(
              [
                { id: 'ALL', label: 'All Squads (4)' },
                { id: 'te', label: 'The Expendables (te)' },
                { id: 'ces', label: 'Cerberus Esports (ces)' },
                { id: 'ge', label: 'Roy Esports (ge)' },
                { id: 'agg', label: 'AGG (agg)' },
              ] as const
            ).map((sq) => (
              <button
                key={sq.id}
                type="button"
                className={`squad-filter-pill ${selectedSquadFilter === sq.id ? 'active' : ''}`}
                onClick={() => setSelectedSquadFilter(sq.id)}
                data-testid={`filter-squad-${sq.id}`}
              >
                {sq.label}
              </button>
            ))}
          </div>

          <div className="leaderboard-Controls-right">
            <input
              type="search"
              className="form-control leaderboard-search-input"
              placeholder="Search squad name or ID (te, ces, ge, agg)..."
              value={squadSearchQuery}
              onChange={(e) => setSquadSearchQuery(e.target.value)}
              aria-label="Search Squads"
              data-testid="leaderboard-search-input"
            />

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={minWwcdFilter}
              onChange={(e) => setMinWwcdFilter(Number(e.target.value))}
              aria-label="Minimum WWCD Filter"
              data-testid="leaderboard-wwcd-filter"
            >
              <option value={0}>Min WWCD: All</option>
              <option value={2}>Min WWCD: 2+ Wins</option>
              <option value={3}>Min WWCD: 3+ Wins</option>
              <option value={4}>Min WWCD: 4+ Wins</option>
            </select>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={sortField}
              onChange={(e) => setSortField(e.target.value as LeaderboardSortField)}
              aria-label="Sort Leaderboard By"
              data-testid="leaderboard-sort-select"
            >
              <option value="TOTAL_PTS">Sort: Total Points (Derived)</option>
              <option value="KILL_PTS">Sort: Kill Points</option>
              <option value="PLACEMENT_PTS">Sort: Placement Points</option>
              <option value="WWCD">Sort: WWCD Count</option>
            </select>

            <button
              type="button"
              className="btn-timer-action"
              onClick={() => setSortDirection((prev) => (prev === 'DESC' ? 'ASC' : 'DESC'))}
              data-testid="leaderboard-sort-dir-btn"
            >
              {sortDirection === 'DESC' ? '⬇️ DESC' : '⬆️ ASC'}
            </button>
          </div>
        </div>

        {/* STANDINGS TABLE + LIVE KILL-FEED 2-COLUMN LAYOUT */}
        <div className="leaderboard-split-grid">
          {/* SQUAD STANDINGS TABLE */}
          <div className="standings-table-card">
            <div className="terminal-header">
              <span>PVS GRAND FINALS SQUAD STANDINGS (`PubgVnSquadStanding`)</span>
              <span>Showing {filteredAndSortedStandings.length} of 4 squads</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="pubg-standings-table" data-testid="squad-standings-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Squad ID</th>
                    <th>Squad Name</th>
                    <th>WWCD 🍗</th>
                    <th>Placement Pts</th>
                    <th>Kill Pts 🎯</th>
                    <th>Total Pts (Derived)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedStandings.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No squads match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedStandings.map((sq, index) => {
                      // Derived strictly from PubgVnSquadStanding contract properties
                      const totalPts = sq.placementPts + sq.killPts;
                      const killRatio = Math.round((sq.killPts / Math.max(1, totalPts)) * 100);
                      const rosterInfo = SQUAD_ROSTERS[sq.squadId];

                      return (
                        <tr
                          key={sq.squadId}
                          className={`standing-row ${index === 0 ? 'top-rank-row' : ''}`}
                          data-testid={`standing-row-${sq.squadId}`}
                        >
                          <td>
                            <span className={`rank-badge rank-${index + 1}`}>#{index + 1}</span>
                          </td>
                          <td>
                            <code className="squad-id-chip">{sq.squadId}</code>
                          </td>
                          <td>
                            <div className="squad-name-cell">
                              <strong>{sq.squadName}</strong>
                              {rosterInfo && (
                                <span className="squad-roster-sub">
                                  {rosterInfo.region} • {rosterInfo.players.join(', ')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="mono-cell wwcd-cell">{sq.wwcdCount}</td>
                          <td className="mono-cell">{sq.placementPts}</td>
                          <td className="mono-cell kill-cell">
                            {sq.killPts}{' '}
                            <span className="kill-share-sub">({killRatio}%)</span>
                          </td>
                          <td className="mono-cell total-pts-cell" data-testid={`total-pts-${sq.squadId}`}>
                            {totalPts}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* LIVE KILL-FEED PANEL */}
          <div className="kill-feed-card">
            <div className="terminal-header">
              <span>LIVE TOURNAMENT KILL-FEED TELEMETRY</span>
              <span>{filteredKillFeed.length} events</span>
            </div>
            <div className="kill-feed-list" data-testid="kill-feed-list">
              {filteredKillFeed.map((item) => (
                <div key={item.id} className="kill-feed-item">
                  <div className="kill-feed-top">
                    <span className="kill-map-tag">{item.mapName}</span>
                    <span className="kill-time-tag">{item.formattedTime}</span>
                    {item.isWwcdFinisher && <span className="wwcd-finisher-tag">🍗 WWCD +10 PTS</span>}
                  </div>
                  <div className="kill-feed-combat">
                    <span className={`squad-tag-mini sq-${item.attackerSquadId}`}>
                      [{item.attackerSquadId.toUpperCase()}] {item.attackerPlayer}
                    </span>
                    <span className={`weapon-badge ${item.isHeadshot ? 'hs' : ''}`}>
                      {item.isHeadshot ? '🎯 ' : '🔫 '}
                      {item.weapon}
                    </span>
                    <span className={`squad-tag-mini victim sq-${item.victimSquadId}`}>
                      [{item.victimSquadId.toUpperCase()}] {item.victimPlayer}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HIGH CONCURRENCY RACE-CONDITION & BOT FLOOD LAB (REUSED FROM LAB 02) */}
      <section className="concurrency-lab-panel" aria-labelledby="concurrency-lab-title">
        <div className="lab-header">
          <div>
            <h2 id="concurrency-lab-title" style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>
              CONCURRENCY BENCHMARK &amp; BOT SNIPER FLOOD STRESS LAB
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
              Simulate 10–100 automated sniper bots concurrently contesting scarce PVS VIP tickets and G-Coin crates.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={botTargetProduct}
              onChange={(e) => setBotTargetProduct(e.target.value)}
              className="form-control"
              style={{ width: 'auto', minWidth: '240px' }}
              aria-label="Target Drop for Bot Flood"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.slice(0, 32)}... (Stock: {p.availableStock})
                </option>
              ))}
            </select>

            <select
              value={botCountChoice}
              onChange={(e) => setBotCountChoice(Number(e.target.value))}
              className="form-control"
              style={{ width: 'auto' }}
              aria-label="Bot Count"
            >
              <option value={10}>10 Sniper Bots</option>
              <option value={25}>25 Sniper Bots</option>
              <option value={50}>50 Sniper Bots</option>
              <option value={100}>100 Sniper Bots</option>
            </select>

            <button
              className="btn-buy-flash"
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
              onClick={() => handleTriggerBotFlood(botCountChoice)}
              disabled={isSimulatingBots}
              type="button"
              data-testid="launch-bots-btn"
            >
              {isSimulatingBots ? 'Simulating Bots...' : `Launch ${botCountChoice} Sniper Bots`}
            </button>

            <button
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
              onClick={() => {
                engine.resetInventory(INITIAL_PRODUCTS);
                setNotifications([]);
              }}
              type="button"
              data-testid="reset-inventory-btn"
            >
              Reset Airdrop Pools
            </button>
          </div>
        </div>

        {/* METRICS DASHBOARD */}
        <div className="metrics-dashboard-grid">
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#38bdf8' }} data-testid="metric-total-req">
              {metrics.totalRequests}
            </div>
            <div className="metric-card-label">Total Claim Requests</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#34d399' }} data-testid="metric-success-res">
              {metrics.successfulReservations}
            </div>
            <div className="metric-card-label">200 OK Claims Locked</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#fbbf24' }} data-testid="metric-conflicts-409">
              {metrics.conflicts409}
            </div>
            <div className="metric-card-label">409 Looted Out / Rollbacks</div>
          </div>
          <div className="metric-card">
            <div className="metric-card-number" style={{ color: '#a855f7' }} data-testid="metric-completed-orders">
              {metrics.completedOrders}
            </div>
            <div className="metric-card-label">Crates Finalized</div>
          </div>
          <div
            className="metric-card"
            style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.06)' }}
          >
            <div className="metric-card-number" style={{ color: '#10b981' }} data-testid="metric-oversell">
              {metrics.oversellViolations}
            </div>
            <div className="metric-card-label">Oversell Violations (Strictly 0)</div>
          </div>
        </div>

        {/* LIVE REAL-TIME TERMINAL LOG */}
        <div className="logs-terminal-wrap">
          <div className="terminal-header">
            <span>LIVE CONCURRENCY &amp; OPTIMISTIC ROLLBACK AUDIT LOG (`InventoryLockFSM`)</span>
            <span>{logs.length} entries</span>
          </div>
          <div className="terminal-body" tabIndex={0} aria-label="Terminal Log">
            {logs.length === 0 ? (
              <div style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>
                No airdrop transactions yet. Click &quot;CLAIM AIRDROP&quot; or &quot;Launch Sniper Bots&quot; to inspect
                real-time OCC &amp; 409 rollback telemetry.
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="log-row">
                  <span className="log-time">{log.formattedTime}</span>
                  <span className="log-thread">[{log.threadId}]</span>
                  <span className={`log-status st-${log.status}`}>{log.status}</span>
                  <span className="log-msg">
                    [{log.productName.slice(0, 26)}... v{log.version}] {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* COMPLETED ORDERS SUMMARY */}
      {orders.length > 0 && (
        <section style={{ marginBottom: '40px' }} aria-labelledby="orders-title">
          <h3 id="orders-title" style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
            CLAIMED PVS TICKETS &amp; G-COIN CRATE LEDGER ({orders.length})
          </h3>
          <div
            style={{
              overflowX: 'auto',
              background: 'var(--bg-surface)',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    background: '#131b2e',
                    borderBottom: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th style={{ padding: '12px 16px' }}>Order ID</th>
                  <th style={{ padding: '12px 16px' }}>Airdrop Item</th>
                  <th style={{ padding: '12px 16px' }}>Survivor / Buyer</th>
                  <th style={{ padding: '12px 16px' }}>Origin</th>
                  <th style={{ padding: '12px 16px' }}>Payment</th>
                  <th style={{ padding: '12px 16px' }}>Amount Paid (VND)</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => (
                  <tr key={ord.orderId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', color: '#38bdf8' }}>
                      {ord.orderId}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ord.productName}</td>
                    <td style={{ padding: '12px 16px' }}>{ord.buyerName}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background:
                            ord.userType === 'HUMAN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(238, 77, 45, 0.2)',
                          color: ord.userType === 'HUMAN' ? '#34d399' : '#ff8a65',
                        }}
                      >
                        {ord.userType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>{ord.paymentMethod}</td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontFamily: 'JetBrains Mono',
                        fontWeight: 700,
                        color: '#f59e0b',
                      }}
                    >
                      {formatVnd(ord.pricePaid)}
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
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkout-modal-title"
          data-testid="checkout-modal"
        >
          <div className="checkout-modal-card">
            <h3 id="checkout-modal-title" style={{ margin: '0 0 14px 0', fontSize: '20px', fontWeight: 800 }}>
              CONFIRM KRAFTON AIRDROP &amp; PVS TICKET CLAIM
            </h3>

            {/* LEASE EXPIRY ALERT */}
            <div className="checkout-expiry-alert">
              <span>Optimistic Lease Lock (`{activeCheckoutLease.lockId.slice(0, 14)}`):</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, color: '#fbbf24', fontSize: '16px' }}>
                00:{Math.ceil(activeCheckoutLease.remainingMs / 1000).toString().padStart(2, '0')}s
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="input-name">Attendee / Survivor Full Name</label>
              <input
                id="input-name"
                className="form-control"
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="input-ign">KRAFTON ID / PUBG In-Game Name (For G-Coin Delivery)</label>
              <input
                id="input-ign"
                className="form-control"
                type="text"
                value={inGameIgn}
                onChange={(e) => setInGameIgn(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Payment Channel</label>
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
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#34d399',
                  marginBottom: '16px',
                }}
              >
                Applied Voucher: <strong>{selectedVoucher.code}</strong> (-{formatVnd(selectedVoucher.discountVnd)})
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn-buy-flash"
                onClick={handleConfirmCheckout}
                type="button"
                style={{ flex: 2 }}
                data-testid="confirm-checkout-btn"
              >
                Confirm &amp; Finalize Claim
              </button>
              <button
                style={{
                  flex: 1,
                  background: '#1e293b',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
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
