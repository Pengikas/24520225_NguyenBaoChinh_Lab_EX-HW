// products-data.ts
// Realistic Vietnam 11.11 Mega-Sale (Shopee / Lazada Midnight Super Sale) Product Catalog

import { ProductInventory } from './types';

export const INITIAL_PRODUCTS: ProductInventory[] = [
  {
    id: 'vn-prod-01',
    name: 'Apple iPhone 16 Pro Max 256GB Desert Titanium (VN/A)',
    brand: 'Apple',
    originalPrice: 34990000,
    flashSalePrice: 17495000, // 50% OFF
    discountPercent: 50,
    totalStock: 6,
    availableStock: 6,
    reservedStock: 0,
    soldStock: 0,
    category: 'Điện Thoại & Phụ Kiện',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="30" y="10" width="60" height="100" rx="14" fill="%2326262b" stroke="%23c5a880" stroke-width="3"/><rect x="34" y="14" width="52" height="92" rx="11" fill="%23131317"/><circle cx="60" cy="22" r="3" fill="%233a3a44"/><rect x="42" y="32" width="36" height="48" rx="6" fill="%231f2937"/><text x="60" y="60" fill="%23c5a880" font-size="9" text-anchor="middle" font-weight="bold">iPhone 16</text><text x="60" y="72" fill="%239ca3af" font-size="7" text-anchor="middle">Pro Max</text></svg>',
    description: 'Chip Apple A18 Pro 3nm cực mạnh, màn hình Super Retina XDR 6.9 inch 120Hz, nút Camera Control thế hệ mới.',
    version: 1,
  },
  {
    id: 'vn-prod-02',
    name: 'Tai nghe Chống Ồn Chủ Động Sony WH-1000XM5 Black',
    brand: 'Sony',
    originalPrice: 8990000,
    flashSalePrice: 2697000, // 70% OFF
    discountPercent: 70,
    totalStock: 8,
    availableStock: 8,
    reservedStock: 0,
    soldStock: 0,
    category: 'Thiết Bị Âm Thanh',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M25 60 A35 35 0 0 1 95 60" fill="none" stroke="%2338bdf8" stroke-width="6" stroke-linecap="round"/><ellipse cx="25" cy="65" rx="10" ry="16" fill="%231e293b" stroke="%2338bdf8" stroke-width="3"/><ellipse cx="95" cy="65" rx="10" ry="16" fill="%231e293b" stroke="%2338bdf8" stroke-width="3"/><text x="60" y="85" fill="%23f8fafc" font-size="8" text-anchor="middle" font-weight="bold">SONY XM5</text><text x="60" y="96" fill="%2338bdf8" font-size="7" text-anchor="middle">Hi-Res ANC</text></svg>',
    description: 'Bộ xử lý tích hợp V1 + QN1 hàng đầu thế giới, chống ồn 8 micro đỉnh cao, pin 30 giờ liên tục.',
    version: 1,
  },
  {
    id: 'vn-prod-03',
    name: 'Bàn Phím Cơ Không Dây NuPhy Air75 V2 Low-Profile RGB',
    brand: 'NuPhy',
    originalPrice: 3200000,
    flashSalePrice: 1280000, // 60% OFF
    discountPercent: 60,
    totalStock: 10,
    availableStock: 10,
    reservedStock: 0,
    soldStock: 0,
    category: 'Máy Tính & Phụ Kiện',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="15" y="35" width="90" height="50" rx="8" fill="%231e293b" stroke="%23a855f7" stroke-width="3"/><rect x="22" y="42" width="12" height="10" rx="2" fill="%23ec4899"/><rect x="38" y="42" width="12" height="10" rx="2" fill="%233b82f6"/><rect x="54" y="42" width="12" height="10" rx="2" fill="%23eab308"/><rect x="70" y="42" width="12" height="10" rx="2" fill="%2310b981"/><rect x="86" y="42" width="12" height="10" rx="2" fill="%238b5cf6"/><rect x="30" y="60" width="60" height="14" rx="4" fill="%23334155"/><text x="60" y="70" fill="%23ffffff" font-size="6" text-anchor="middle">NUPHY 75%</text></svg>',
    description: 'Switch Gateron Low-profile 2.0, polling rate 1000Hz 2.4Ghz, pin 4000mAh, tương thích Mac & Windows.',
    version: 1,
  },
  {
    id: 'vn-prod-04',
    name: 'Nồi Chiên Không Dầu Điện Tử Lock&Lock 5.2L EJF357BLK',
    brand: 'Lock&Lock',
    originalPrice: 2850000,
    flashSalePrice: 855000, // 70% OFF
    discountPercent: 70,
    totalStock: 12,
    availableStock: 12,
    reservedStock: 0,
    soldStock: 0,
    category: 'Điện Gia Dụng',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="25" y="25" width="70" height="70" rx="16" fill="%231e293b" stroke="%23f97316" stroke-width="3"/><circle cx="60" cy="48" r="14" fill="%230f172a" stroke="%23fb923c" stroke-width="2"/><text x="60" y="52" fill="%23fb923c" font-size="8" text-anchor="middle" font-weight="bold">200°C</text><rect x="40" y="72" width="40" height="10" rx="4" fill="%23334155"/><text x="60" y="105" fill="%23f97316" font-size="7" text-anchor="middle" font-weight="bold">Lock&Lock 5.2L</text></svg>',
    description: 'Dung tích khủng 5.2L công nghệ Rapid Air giảm 80% dầu mỡ thừa, bảng điều khiển cảm ứng LED 8 chế độ.',
    version: 1,
  },
  {
    id: 'vn-prod-05',
    name: 'Giày Thể Thao Sneaker Biti\'s Hunter Street x VietMax 2024',
    brand: 'Biti\'s Hunter',
    originalPrice: 1099000,
    flashSalePrice: 439000, // 60% OFF
    discountPercent: 60,
    totalStock: 15,
    availableStock: 15,
    reservedStock: 0,
    soldStock: 0,
    category: 'Thời Trang & Giày Dép',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><path d="M20 75 Q40 50 70 55 Q90 60 100 75 L95 85 Q60 88 20 85 Z" fill="%23ef4444" stroke="%23ffffff" stroke-width="2"/><circle cx="45" cy="70" r="5" fill="%23ffffff"/><path d="M20 85 L100 85 L98 92 L22 92 Z" fill="%23ffffff"/><text x="60" y="106" fill="%23ef4444" font-size="7" text-anchor="middle" font-weight="bold">Biti\'s VietMax</text></svg>',
    description: 'Đế đệm EVA siêu nhẹ kháng khuẩn, cảm hứng nghệ thuật đường phố Sài Gòn, phối màu giới hạn.',
    version: 1,
  },
  {
    id: 'vn-prod-06',
    name: 'Máy Hút Bụi Không Dây Dyson V12 Detect Slim Total Clean',
    brand: 'Dyson',
    originalPrice: 19990000,
    flashSalePrice: 9995000, // 50% OFF
    discountPercent: 50,
    totalStock: 5,
    availableStock: 5,
    reservedStock: 0,
    soldStock: 0,
    category: 'Thiết Bị Nhà Cửa',
    image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect x="25" y="30" width="22" height="30" rx="4" fill="%23475569" stroke="%23eab308" stroke-width="2"/><rect x="47" y="42" width="50" height="6" rx="2" fill="%23eab308"/><polygon points="97,36 108,45 97,54" fill="%23f59e0b"/><text x="60" y="80" fill="%23f59e0b" font-size="8" text-anchor="middle" font-weight="bold">DYSON V12</text><text x="60" y="92" fill="%2394a3b8" font-size="7" text-anchor="middle">Laser Slim</text></svg>',
    description: 'Đầu hút laser phát hiện bụi bẩn vi mô vô hình, lực hút siêu mạnh 150AW, màn hình LCD đếm hạt bụi thời gian thực.',
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
    code: 'SHOPEE1111',
    name: 'Voucher Siêu Sale 11.11',
    discountVnd: 500000,
    minOrderVnd: 2000000,
    badge: 'GIẢM 500K',
  },
  {
    code: 'FREESHIPEXTRA',
    name: 'Miễn Phí Vận Chuyển Hỏa Tốc',
    discountVnd: 70000,
    minOrderVnd: 300000,
    badge: 'FREESHIP 70K',
  },
  {
    code: 'MIDNIGHTVIP',
    name: 'Voucher Nửa Đêm Độc Quyền',
    discountVnd: 1000000,
    minOrderVnd: 5000000,
    badge: 'GIẢM 1 TRIỆU',
  },
];
