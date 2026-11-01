// products-data.ts
// KRAFTON x PUBG Vietnam Championship & Airdrop Arena Catalog (PVS Finals Tickets & G-Coin Crates)

import { ProductInventory, PubgCrateDrop } from './types';

// Base epoch reference so drops have deterministic warm-up and live windows
const BASE_NOW_MS = Date.now();

export const INITIAL_CRATE_DROPS: readonly PubgCrateDrop[] = [
  {
    id: 'pvs-vip-ticket-01',
    title: 'PVS Grand Finals VIP Ticket (Front-Row Arena + Exclusive Merch Pack)',
    priceVnd: 1500000,
    remainingStock: 5,
    dropEpochMs: BASE_NOW_MS + 15000, // 15s warm-up countdown on load, then AIRDROP_LIVE
  },
  {
    id: 'pubg-gcoin-crate-01',
    title: 'KRAFTON Contraband G-Coin Crate (10,500 G-Coin + Progressive Skin Token)',
    priceVnd: 1250000,
    remainingStock: 8,
    dropEpochMs: BASE_NOW_MS - 5000, // Already AIRDROP_LIVE for immediate claiming
  },
  {
    id: 'pubg-gcoin-crate-02',
    title: 'Erangel Care Package Airdrop Crate (5,000 G-Coin + Level 3 Helmet Keychain)',
    priceVnd: 650000,
    remainingStock: 10,
    dropEpochMs: BASE_NOW_MS - 5000, // Already AIRDROP_LIVE
  },
  {
    id: 'pubg-gcoin-crate-03',
    title: 'PVS Championship Collector G-Coin Supply Drop (2,500 G-Coin + Team Jersey)',
    priceVnd: 350000,
    remainingStock: 12,
    dropEpochMs: BASE_NOW_MS + 35000, // 35s warm-up countdown
  },
  {
    id: 'pvs-arena-pass-01',
    title: 'PVS Grand Finals Standard Arena Pass (2-Day Ho Chi Minh City Watch Party)',
    priceVnd: 450000,
    remainingStock: 15,
    dropEpochMs: BASE_NOW_MS - 5000, // Already AIRDROP_LIVE
  },
  {
    id: 'pubg-mythic-crate-01',
    title: 'Airdrop Mythic Aureate G-Coin Crate (22,000 G-Coin + Golden Pan Replica)',
    priceVnd: 2490000,
    remainingStock: 4,
    dropEpochMs: BASE_NOW_MS - 5000, // Already AIRDROP_LIVE, ultra-scarce stock
  },
];

export const INITIAL_PRODUCTS: ProductInventory[] = [
  {
    id: 'pvs-vip-ticket-01',
    name: 'PVS Grand Finals VIP Ticket (Front-Row Arena + Exclusive Merch Pack)',
    brand: 'KRAFTON x PVS',
    originalPrice: 3000000,
    flashSalePrice: 1500000,
    discountPercent: 50,
    totalStock: 5,
    availableStock: 5,
    reservedStock: 0,
    soldStock: 0,
    category: 'PVS Finals VIP Ticket',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="14" y="26" width="92" height="68" rx="10" fill="%231e293b" stroke="%23f59e0b" stroke-width="3"/><path d="M40 26 L40 94" stroke="%23f59e0b" stroke-width="2" stroke-dasharray="4 4"/><text x="73" y="54" fill="%23fbbf24" font-size="11" text-anchor="middle" font-weight="bold">PVS VIP</text><text x="73" y="70" fill="%23f8fafc" font-size="8" text-anchor="middle">GRAND FINALS</text><text x="27" y="63" fill="%23f59e0b" font-size="8" text-anchor="middle" font-weight="bold">PASS</text></svg>',
    description: 'VIP front-row seating at PUBG Vietnam Series Grand Finals, priority players meet-and-greet, and physical Level 3 Backpack merch kit.',
    version: 1,
  },
  {
    id: 'pubg-gcoin-crate-01',
    name: 'KRAFTON Contraband G-Coin Crate (10,500 G-Coin + Progressive Skin Token)',
    brand: 'G-Coin Crate',
    originalPrice: 2500000,
    flashSalePrice: 1250000,
    discountPercent: 50,
    totalStock: 8,
    availableStock: 8,
    reservedStock: 0,
    soldStock: 0,
    category: 'G-Coin Airdrop Crate',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="22" y="34" width="76" height="62" rx="8" fill="%237f1d1d" stroke="%2338bdf8" stroke-width="3"/><rect x="22" y="34" width="76" height="20" rx="4" fill="%231e3a8a"/><line x1="60" y1="34" x2="60" y2="96" stroke="%23f59e0b" stroke-width="4"/><text x="60" y="75" fill="%23fbbf24" font-size="10" text-anchor="middle" font-weight="bold">10,500 G</text></svg>',
    description: 'High-value Contraband supply drop containing 10,500 G-Coin, 50 Contraband Coupons, and 1 Schematic for progressive weapon upgrades.',
    version: 1,
  },
  {
    id: 'pubg-gcoin-crate-02',
    name: 'Erangel Care Package Airdrop Crate (5,000 G-Coin + Level 3 Helmet Keychain)',
    brand: 'G-Coin Crate',
    originalPrice: 1300000,
    flashSalePrice: 650000,
    discountPercent: 50,
    totalStock: 10,
    availableStock: 10,
    reservedStock: 0,
    soldStock: 0,
    category: 'G-Coin Airdrop Crate',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M30 40 Q60 10 90 40" fill="none" stroke="%2394a3b8" stroke-width="2"/><line x1="35" y1="40" x2="48" y2="62" stroke="%2394a3b8" stroke-width="1.5"/><line x1="85" y1="40" x2="72" y2="62" stroke="%2394a3b8" stroke-width="1.5"/><rect x="35" y="60" width="50" height="40" rx="6" fill="%23dc2626" stroke="%233b82f6" stroke-width="3"/><text x="60" y="84" fill="%23ffffff" font-size="9" text-anchor="middle" font-weight="bold">5,000 G</text></svg>',
    description: 'Signature red-and-blue Erangel air-dropped supply crate bundled with 5,000 G-Coin and a metallic Spetsnaz Level 3 Helmet collectible.',
    version: 1,
  },
  {
    id: 'pubg-gcoin-crate-03',
    name: 'PVS Championship Collector G-Coin Supply Drop (2,500 G-Coin + Team Jersey)',
    brand: 'G-Coin Crate',
    originalPrice: 875000,
    flashSalePrice: 350000,
    discountPercent: 60,
    totalStock: 12,
    availableStock: 12,
    reservedStock: 0,
    soldStock: 0,
    category: 'G-Coin Airdrop Crate',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="25" y="28" width="70" height="66" rx="12" fill="%231e293b" stroke="%2310b981" stroke-width="3"/><circle cx="60" cy="54" r="16" fill="%230f172a" stroke="%2334d399" stroke-width="2"/><text x="60" y="58" fill="%2334d399" font-size="8" text-anchor="middle" font-weight="bold">2,500G</text><text x="60" y="84" fill="%23f8fafc" font-size="8" text-anchor="middle" font-weight="bold">PVS DROP</text></svg>',
    description: 'Official PVS tournament viewer supply crate featuring 2,500 G-Coin and an official Vietnam Championship pro squad jersey voucher.',
    version: 1,
  },
  {
    id: 'pvs-arena-pass-01',
    name: 'PVS Grand Finals Standard Arena Pass (2-Day Ho Chi Minh City Watch Party)',
    brand: 'KRAFTON x PVS',
    originalPrice: 900000,
    flashSalePrice: 450000,
    discountPercent: 50,
    totalStock: 15,
    availableStock: 15,
    reservedStock: 0,
    soldStock: 0,
    category: 'PVS Finals VIP Ticket',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="18" y="32" width="84" height="56" rx="8" fill="%23172554" stroke="%2338bdf8" stroke-width="2.5"/><text x="60" y="56" fill="%2338bdf8" font-size="10" text-anchor="middle" font-weight="bold">ARENA PASS</text><text x="60" y="72" fill="%23e2e8f0" font-size="8" text-anchor="middle">2-DAY FINALS</text></svg>',
    description: '2-day live arena admission in Ho Chi Minh City with in-venue airdrop raffle entry, cheering stick, and 500 bonus G-Coin code.',
    version: 1,
  },
  {
    id: 'pubg-mythic-crate-01',
    name: 'Airdrop Mythic Aureate G-Coin Crate (22,000 G-Coin + Golden Pan Replica)',
    brand: 'G-Coin Crate',
    originalPrice: 4980000,
    flashSalePrice: 2490000,
    discountPercent: 50,
    totalStock: 4,
    availableStock: 4,
    reservedStock: 0,
    soldStock: 0,
    category: 'G-Coin Airdrop Crate',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="24" y="28" width="72" height="64" rx="10" fill="%23422006" stroke="%23fbbf24" stroke-width="3"/><polygon points="60,38 66,50 79,52 69,61 72,74 60,67 48,74 51,61 41,52 54,50" fill="%23fbbf24"/><text x="60" y="86" fill="%23fef08a" font-size="8" text-anchor="middle" font-weight="bold">22,000 G-COIN</text></svg>',
    description: 'Ultra-limited championship mythic crate loaded with 22,000 G-Coin, Chroma weapon skin voucher, and engraved WWCD Golden Pan trophy.',
    version: 1,
  },
];

export interface FlashSaleVoucher {
  code: string;
  name: string;
  discountVnd: number;
  minOrderVnd: number;
  badge: string;
}

export const FLASH_VOUCHERS: FlashSaleVoucher[] = [
  {
    code: 'PVSCHAMP500K',
    name: 'PVS Finals Championship Rebate',
    discountVnd: 500000,
    minOrderVnd: 1500000,
    badge: '500K OFF',
  },
  {
    code: 'GCOINBONUS',
    name: 'KRAFTON Airdrop Instant Voucher',
    discountVnd: 100000,
    minOrderVnd: 350000,
    badge: '100K OFF',
  },
  {
    code: 'WWCDVIP1M',
    name: 'Chicken Dinner Mythic Squad Pass',
    discountVnd: 1000000,
    minOrderVnd: 2400000,
    badge: '1M VND OFF',
  },
];
