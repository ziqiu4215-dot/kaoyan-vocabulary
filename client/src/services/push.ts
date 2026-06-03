/**
 * Push notification service.
 * Works in Capacitor native mode and falls back to Web Push in PWA.
 */

import { isNative } from './native';

// ─── Types ───

export interface PushNotificationSettings {
  enabled: boolean;
  dailyReminderTime: string; // "HH:MM" format, e.g. "09:00"
  streakReminder: boolean;
}

const SETTINGS_KEY = 'kaoyan-push-settings';

// ─── Settings persistence ───

export function getPushSettings(): PushNotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { enabled: false, dailyReminderTime: '09:00', streakReminder: true };
}

export function savePushSettings(settings: PushNotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

// ─── Native push registration ───

export async function registerPushNotifications(): Promise<boolean> {
  if (!isNative()) {
    // Web fallback
    return requestWebNotificationPermission();
  }

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // Request permission
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') return false;

    // Register with FCM/APNs
    await PushNotifications.register();

    // Listen for registration token
    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value);
      // TODO: send this token to your backend to store for later push
    });

    // Listen for incoming notifications when app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (_notification) => {
      // Handle foreground notification display
    });

    return true;
  } catch (error) {
    console.warn('Push notification setup failed:', error);
    return false;
  }
}

// ─── Web notification fallback ───

async function requestWebNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ─── Schedule daily reminder (web fallback using service worker) ───

export function scheduleDailyReminder(time: string): void {
  const [hours, minutes] = time.split(':').map(Number);

  // Calculate next occurrence
  const now = new Date();
  const reminder = new Date(now);
  reminder.setHours(hours, minutes, 0, 0);
  if (reminder <= now) {
    reminder.setDate(reminder.getDate() + 1);
  }

  const msUntil = reminder.getTime() - now.getTime();

  // Only schedule if we're in a browser context and have permission
  if (!isNative() && 'Notification' in window && Notification.permission === 'granted') {
    setTimeout(() => {
      new Notification('研词 — 每日学习提醒', {
        body: '今天的学习任务还在等你！打开研词，每天进步一点点 📚',
        icon: '/icon-192.png',
        tag: 'daily-study',
      });
      // Re-schedule for next day
      scheduleDailyReminder(time);
    }, msUntil);
  }
}

// ─── Streak reminder ───

export function scheduleStreakReminder(): void {
  if (!isNative() && 'Notification' in window && Notification.permission === 'granted') {
    // Remind at 20:00 if they haven't studied today
    const now = new Date();
    const reminder = new Date(now);
    reminder.setHours(20, 0, 0, 0);
    if (reminder <= now) {
      reminder.setDate(reminder.getDate() + 1);
    }

    setTimeout(() => {
      new Notification('🔥 别中断你的打卡！', {
        body: '今天还没学习呢，快来保持你的连续打卡记录！',
        icon: '/icon-192.png',
        tag: 'streak-reminder',
      });
    }, reminder.getTime() - now.getTime());
  }
}
