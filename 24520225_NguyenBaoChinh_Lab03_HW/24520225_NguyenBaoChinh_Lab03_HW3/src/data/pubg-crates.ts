import type { PubgCrateDrop } from '../types/pubg-vn-arena-contract';

// Active drop cutoff window (30 minutes from session initialization)
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export const INITIAL_PUBG_DROPS: PubgCrateDrop[] = [
    {
        id: 'pvs-vip-001',
        title: 'PVS Grand Finals VIP Ticket',
        priceVnd: 500000,
        remainingStock: 20,
        dropEpochMs: Date.now() + THIRTY_MINUTES_MS,
    },
    {
        id: 'gcoin-crate-001',
        title: 'PUBG Vietnam G-Coin Crate',
        priceVnd: 200000,
        remainingStock: 50,
        dropEpochMs: Date.now() + THIRTY_MINUTES_MS,
    },
];
