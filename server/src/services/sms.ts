/**
 * SMS Service — abstraction over SMS providers.
 *
 * Dev mode (default): logs codes to console, always accepts "123456".
 * Production: sends real SMS via Aliyun Dysmsapi.
 *
 * To enable production SMS, set these env vars:
 *   SMS_ACCESS_KEY_ID     — Aliyun AccessKey ID
 *   SMS_ACCESS_KEY_SECRET — Aliyun AccessKey Secret
 *   SMS_SIGN_NAME         — SMS signature (e.g. "研词")
 *   SMS_TEMPLATE_CODE     — SMS template code (e.g. "SMS_123456789")
 */

import logger from '../utils/logger';

interface SmsSender {
  /** Send a verification code. Returns true on success. */
  send(phone: string, code: string): Promise<boolean>;
}

// ─── Dev sender (default) ───

const devSender: SmsSender = {
  async send(phone: string, code: string) {
    logger.info(`SMS dev mode: ${phone} → ${code}`);
    return true;
  },
};

// ─── Aliyun sender ───

let aliyunSender: SmsSender | null = null;

async function createAliyunSender(): Promise<SmsSender | null> {
  try {
    const Dysmsapi = await import('@alicloud/dysmsapi20170525');
    const OpenApi = await import('@alicloud/openapi-client');
    const TeaUtil = await import('@alicloud/tea-util');

    const accessKeyId = process.env.SMS_ACCESS_KEY_ID;
    const accessKeySecret = process.env.SMS_ACCESS_KEY_SECRET;

    if (!accessKeyId || !accessKeySecret) return null;

    const config = new OpenApi.default.Config({
      accessKeyId,
      accessKeySecret,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    const client = new Dysmsapi.default(config);
    const signName = process.env.SMS_SIGN_NAME || '研词';
    const templateCode = process.env.SMS_TEMPLATE_CODE || '';

    return {
      async send(phone: string, code: string) {
        const runtime = new TeaUtil.default.RuntimeOptions({});
        await client.sendSmsWithOptions(
          {
            signName,
            templateCode,
            phoneNumbers: phone,
            templateParam: JSON.stringify({ code }),
          },
          runtime,
        );
        logger.info(`SMS sent to ${phone}`);
        return true;
      },
    };
  } catch {
    logger.warn('Failed to initialize Aliyun SMS client, falling back to dev mode');
    return null;
  }
}

// ─── Unified interface ───

let sender: SmsSender = devSender;
let initPromise: Promise<void> | null = null;

async function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      const isDev = process.env.NODE_ENV !== 'production';
      if (!isDev) {
        const as = await createAliyunSender();
        if (as) sender = as;
        else logger.warn('Running in production without SMS configured — using dev mode');
      }
    })();
  }
  return initPromise;
}

/** Send verification code to phone. Returns the code sent (dev mode) or empty string (production). */
export async function sendVerificationCode(phone: string): Promise<{ success: boolean; code: string }> {
  await ensureInit();

  // Generate 6-digit code
  const isDev = process.env.NODE_ENV !== 'production';
  const code = isDev
    ? '123456'
    : String(Math.floor(100000 + Math.random() * 900000));

  const ok = await sender.send(phone, code);
  return { success: ok, code: isDev ? code : '' };
}
