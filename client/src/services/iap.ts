/**
 * In-App Purchase service — scaffolding.
 *
 * Full IAP requires:
 * 1. Apple Developer account → App Store Connect → create in-app purchases
 * 2. Google Play Console → create in-app products
 * 3. RevenueCat account (free tier) or cordova-plugin-purchase
 *
 * This module provides the structure. Real purchase flow activates after
 * configuring RevenueCat or another IAP provider.
 */

import { isNative } from './native';

// ─── Types ───

export interface IapProduct {
  id: string;
  title: string;
  description: string;
  price: string; // formatted, e.g. "¥6.00"
  type: 'consumable' | 'non_consumable';
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
}

// ─── Product definitions ───

const PRODUCTS: IapProduct[] = [
  {
    id: 'com.kaoyan.yanci.remove_ads',
    title: '移除广告',
    description: '永久移除应用内所有广告',
    price: '¥12.00',
    type: 'non_consumable',
  },
  {
    id: 'com.kaoyan.yanci.advanced_wordbooks',
    title: '高级词书包',
    description: '解锁全部高级词书（考研真题词、专业词汇等）',
    price: '¥18.00',
    type: 'non_consumable',
  },
  {
    id: 'com.kaoyan.yanci.premium',
    title: '研词 Pro',
    description: '移除广告 + 全部高级词书 + AI 例句生成',
    price: '¥28.00',
    type: 'non_consumable',
  },
];

// ─── Product fetching ───

export async function getProducts(): Promise<IapProduct[]> {
  if (!isNative()) {
    // Web mode: return mock products for UI preview
    return PRODUCTS;
  }

  // TODO: Integrate RevenueCat or cordova-plugin-purchase
  // const offerings = await Purchases.getOfferings();
  // return offerings.current.availablePackages.map(...)

  return PRODUCTS;
}

// ─── Purchase ───

export async function purchaseProduct(productId: string): Promise<PurchaseResult> {
  if (!isNative()) {
    // Web mode: simulate purchase (for dev/testing)
    console.log(`[IAP Web] Simulated purchase: ${productId}`);
    return { success: true, productId };
  }

  // TODO: Real purchase flow
  // const { purchaserInfo } = await Purchases.purchasePackage(pkg);
  // return { success: true, productId };

  console.warn('[IAP] Native purchases require RevenueCat integration');
  return { success: false, error: '原生购买需要配置 RevenueCat' };
}

// ─── Restore purchases ───

export async function restorePurchases(): Promise<string[]> {
  if (!isNative()) {
    const stored = localStorage.getItem('kaoyan-purchases');
    return stored ? JSON.parse(stored) : [];
  }

  // TODO: RevenueCat restore
  // const { purchaserInfo } = await Purchases.restorePurchases();
  // return purchaserInfo.activeSubscriptions;

  return [];
}

// ─── Check entitlement ───

const PURCHASES_KEY = 'kaoyan-purchases';

export function isPremium(): boolean {
  try {
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    return purchases.includes('com.kaoyan.yanci.premium');
  } catch {
    return false;
  }
}

export function hasRemovedAds(): boolean {
  try {
    const purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '[]');
    return purchases.includes('com.kaoyan.yanci.remove_ads') ||
           purchases.includes('com.kaoyan.yanci.premium');
  } catch {
    return false;
  }
}
