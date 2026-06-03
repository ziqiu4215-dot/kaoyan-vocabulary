/**
 * Native bridge — unified API for Capacitor plugins.
 * Falls back gracefully in web/PWA mode when plugins are unavailable.
 */

type NativeStatus = 'native' | 'pwa' | 'web';

// ─── Platform detection ───

export function getPlatform(): NativeStatus {
  if (typeof window === 'undefined') return 'web';
  // Capacitor injects itself on window
  if ('Capacitor' in window) return 'native';
  // PWA standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
  return 'web';
}

export function isNative(): boolean {
  return getPlatform() === 'native';
}

// ─── API base URL ───

/**
 * Returns the correct API base URL for the current platform.
 * - Native (Capacitor): uses the configured server URL or localhost for emulator
 * - Web/PWA: uses relative '/api' path (handled by Vite proxy or Nginx)
 */
export function getApiBaseUrl(): string {
  if (isNative()) {
    // Capacitor: point to your production API server
    // In dev (emulator), localhost maps to the host machine
    return import.meta.env.VITE_API_URL || 'http://10.0.2.2:5000';
  }
  return '/api';
}

// ─── Status Bar ───

let StatusBar: any = null;
async function getStatusBar() {
  if (!StatusBar) {
    try {
      const mod = await import('@capacitor/status-bar');
      StatusBar = mod.StatusBar;
    } catch { /* not available in web */ }
  }
  return StatusBar;
}

export async function setStatusBarStyle(style: 'light' | 'dark') {
  const sb = await getStatusBar();
  if (sb) {
    try {
      if (style === 'light') await sb.setStyle({ style: 'light' });
      else await sb.setStyle({ style: 'dark' });
    } catch { /* ignore */ }
  }
}

// ─── Splash Screen ───

let SplashScreen: any = null;
async function getSplashScreen() {
  if (!SplashScreen) {
    try {
      const mod = await import('@capacitor/splash-screen');
      SplashScreen = mod.SplashScreen;
    } catch { /* not available */ }
  }
  return SplashScreen;
}

export async function hideSplashScreen() {
  const ss = await getSplashScreen();
  if (ss) {
    try { await ss.hide(); } catch { /* ignore */ }
  }
}

// ─── Keyboard ───

let Keyboard: any = null;
async function getKeyboard() {
  if (!Keyboard) {
    try {
      const mod = await import('@capacitor/keyboard');
      Keyboard = mod.Keyboard;
    } catch { /* not available */ }
  }
  return Keyboard;
}

export async function addKeyboardListener(callback: (height: number) => void) {
  const kb = await getKeyboard();
  if (kb) {
    try {
      await kb.addListener('keyboardWillShow', (info: any) => callback(info.keyboardHeight));
      await kb.addListener('keyboardWillHide', () => callback(0));
    } catch { /* ignore */ }
  }
}

// ─── Share (Phase 4 placeholder) ───

export async function shareContent(title: string, text: string, url?: string) {
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title, text, url });
      return true;
    } catch { /* user cancelled or not available */ }
  }
  // Web fallback: use Web Share API
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch { /* user cancelled */ }
  }
  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(`${title}\n${text}`);
  } catch { /* ignore */ }
  return false;
}

// ─── Push Notifications (Phase 4 placeholder) ───

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── App lifecycle ───

export function onAppResume(callback: () => void) {
  document.addEventListener('resume', callback);
  // Also handle web visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') callback();
  });
}
