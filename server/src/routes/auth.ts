import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db from '../config/db';
import { authMiddleware, signToken } from '../middleware/auth';
import AppError from '../utils/AppError';

const router = Router();

// ─── 短信验证码（开发模式：固定 123456）───

// 内存存储验证码（生产环境应改用 Redis）
const smsCodes = new Map<string, { code: string; expires: number }>();

router.post('/send-sms', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone } = req.body;
    if (!phone) throw new AppError('请输入手机号', 400);

    // 开发模式：固定验证码 123456
    const code = process.env.NODE_ENV === 'production'
      ? String(Math.floor(100000 + Math.random() * 900000))
      : '123456';

    smsCodes.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });

    if (process.env.NODE_ENV !== 'production') {
      res.json({ success: true, message: '验证码已发送', data: { code } }); // 开发模式返回验证码
    } else {
      // TODO: 接入阿里云/腾讯云短信服务
      console.log(`[SMS] ${phone} → ${code}`);
      res.json({ success: true, message: '验证码已发送' });
    }
  } catch (error) {
    next(error);
  }
});

function verifySmsCode(phone: string, code: string): boolean {
  const record = smsCodes.get(phone);
  if (!record) return false;
  if (Date.now() > record.expires) { smsCodes.delete(phone); return false; }
  if (record.code !== code) return false;
  smsCodes.delete(phone);
  return true;
}

// ─── 用户名/邮箱 + 密码注册 ───

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) throw new AppError('用户名、邮箱和密码为必填项', 400);
    if (password.length < 6) throw new AppError('密码至少 6 位', 400);

    const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existing) throw new AppError('用户名或邮箱已被注册', 409);

    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
    ).run(username, email, hash);

    const userId = result.lastInsertRowid as number;
    const token = signToken(userId);

    res.status(201).json({ success: true, data: { token, user: { id: userId, username, email } } });
  } catch (error) {
    next(error);
  }
});

// ─── 密码登录 ───

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) throw new AppError('请输入用户名和密码', 400);

    const user = db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ?'
    ).get(username, username) as any;
    if (!user) throw new AppError('用户名或密码错误', 401);

    const valid = await bcrypt.compare(password, user.password_hash || '');
    if (!valid) throw new AppError('用户名或密码错误', 401);

    const token = signToken(user.id);
    res.json({
      success: true,
      data: { token, user: formatUser(user) },
    });
  } catch (error) {
    next(error);
  }
});

// ─── 手机号 + 验证码登录（自动注册）───

router.post('/login-by-phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) throw new AppError('请输入手机号和验证码', 400);

    if (!verifySmsCode(phone, code)) {
      throw new AppError('验证码错误或已过期', 400);
    }

    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;

    if (!user) {
      // 自动注册
      const username = `用户${phone.slice(-4)}`;
      const email = `${phone}@phone.kaoyan.local`;
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, phone) VALUES (?, ?, ?, ?)'
      ).run(username, email, '', phone);
      const userId = result.lastInsertRowid as number;
      user = { id: userId, username, email, phone };
    }

    const token = signToken(user.id);
    res.json({ success: true, data: { token, user: formatUser(user) } });
  } catch (error) {
    next(error);
  }
});

// ─── 绑定手机号（已登录用户）───

router.post('/bind-phone', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) throw new AppError('请输入手机号和验证码', 400);
    if (!verifySmsCode(phone, code)) throw new AppError('验证码错误或已过期', 400);

    const existing = db.prepare('SELECT id FROM users WHERE phone = ? AND id != ?').get(phone, req.userId);
    if (existing) throw new AppError('该手机号已被其他账号绑定', 409);

    db.prepare('UPDATE users SET phone = ?, updated_at = datetime("now") WHERE id = ?').run(phone, req.userId);

    res.json({ success: true, message: '手机号绑定成功' });
  } catch (error) {
    next(error);
  }
});

// ─── QQ 互联 OAuth ───

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

const QQ_APP_ID = process.env.QQ_APP_ID || '';
const QQ_APP_KEY = process.env.QQ_APP_KEY || '';
const QQ_REDIRECT_URI = process.env.QQ_REDIRECT_URI || `${BACKEND_URL}/api/auth/qq/callback`;

router.get('/qq/url', (_req: Request, res: Response) => {
  if (!QQ_APP_ID) {
    res.status(501).json({ success: false, message: 'QQ 登录尚未配置（缺少 QQ_APP_ID）' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  const url = `https://graph.qq.com/oauth2.0/authorize?response_type=code&client_id=${QQ_APP_ID}&redirect_uri=${encodeURIComponent(QQ_REDIRECT_URI)}&state=${state}&scope=get_user_info`;
  res.json({ success: true, data: { url, state } });
});

router.get('/qq/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = req.query;
    if (!code) throw new AppError('授权失败：未获取到授权码', 400);

    // 1. 用 code 换 access_token
    const tokenUrl = `https://graph.qq.com/oauth2.0/token?grant_type=authorization_code&client_id=${QQ_APP_ID}&client_secret=${QQ_APP_KEY}&code=${code}&redirect_uri=${encodeURIComponent(QQ_REDIRECT_URI)}&fmt=json`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) throw new AppError(`QQ 授权失败: ${tokenData.error_description}`, 400);
    const accessToken = tokenData.access_token;

    // 2. 用 access_token 换 openid
    const openidUrl = `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&fmt=json`;
    const openidRes = await fetch(openidUrl);
    const openidData = await openidRes.json() as any;
    if (openidData.error) throw new AppError(`QQ 授权失败: ${openidData.error_description}`, 400);
    const openid = openidData.openid;

    // 3. 获取用户信息
    const infoUrl = `https://graph.qq.com/user/get_user_info?access_token=${accessToken}&oauth_consumer_key=${QQ_APP_ID}&openid=${openid}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json() as any;
    if (infoData.ret !== 0) throw new AppError('获取 QQ 用户信息失败', 400);

    // 4. 查找或创建用户
    const nickname = infoData.nickname || 'QQ用户';
    const avatar = infoData.figureurl_qq_2 || infoData.figureurl_qq_1 || '';

    let user = db.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).get('qq', openid) as any;

    if (!user) {
      const username = generateUsername(nickname);
      const email = `qq_${openid}@oauth.kaoyan.local`;
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, avatar, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, email, '', avatar, 'qq', openid);
      user = { id: result.lastInsertRowid as number, username, email, avatar };
    }

    const jwtToken = signToken(user.id);
    res.redirect(`${FRONTEND_URL}/#/auth/callback?token=${jwtToken}`);
  } catch (error) {
    next(error);
  }
});

// ─── 微信开放平台 OAuth ───

const WX_APP_ID = process.env.WX_APP_ID || '';
const WX_APP_SECRET = process.env.WX_APP_SECRET || '';
const WX_REDIRECT_URI = process.env.WX_REDIRECT_URI || `${BACKEND_URL}/api/auth/wechat/callback`;

router.get('/wechat/url', (_req: Request, res: Response) => {
  if (!WX_APP_ID) {
    res.status(501).json({ success: false, message: '微信登录尚未配置（缺少 WX_APP_ID）' });
    return;
  }
  const state = crypto.randomBytes(16).toString('hex');
  const url = `https://open.weixin.qq.com/connect/qrconnect?appid=${WX_APP_ID}&redirect_uri=${encodeURIComponent(WX_REDIRECT_URI)}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;
  res.json({ success: true, data: { url, state } });
});

router.get('/wechat/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    if (!code) throw new AppError('授权失败：未获取到授权码', 400);

    // 1. 用 code 换 access_token + openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WX_APP_ID}&secret=${WX_APP_SECRET}&code=${code}&grant_type=authorization_code`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json() as any;
    if (tokenData.errcode) throw new AppError(`微信授权失败: ${tokenData.errmsg}`, 400);

    const { access_token: accessToken, openid, unionid } = tokenData;

    // 2. 获取用户信息
    const infoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${accessToken}&openid=${openid}`;
    const infoRes = await fetch(infoUrl);
    const infoData = await infoRes.json() as any;
    if (infoData.errcode) throw new AppError('获取微信用户信息失败', 400);

    const nickname = infoData.nickname || '微信用户';
    const avatar = infoData.headimgurl || '';

    let user = db.prepare(
      'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?'
    ).get('wechat', unionid || openid) as any;

    if (!user) {
      const username = generateUsername(nickname);
      const email = `wx_${openid}@oauth.kaoyan.local`;
      const result = db.prepare(
        'INSERT INTO users (username, email, password_hash, avatar, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(username, email, '', avatar, 'wechat', unionid || openid);
      user = { id: result.lastInsertRowid as number, username, email, avatar };
    }

    const token = signToken(user.id);
    res.redirect(`/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
});

// ─── 获取当前用户 ───

router.get('/me', authMiddleware, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = db.prepare(
      'SELECT id, username, email, phone, avatar, oauth_provider, created_at FROM users WHERE id = ?'
    ).get(req.userId!) as any;

    if (!user) throw new AppError('用户不存在', 404);
    res.json({ success: true, data: formatUser(user) });
  } catch (error) {
    next(error);
  }
});

// ─── 工具函数 ───

function formatUser(u: any) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    phone: u.phone || undefined,
    avatar: u.avatar || '',
    oauthProvider: u.oauth_provider || undefined,
    createdAt: u.created_at,
  };
}

function generateUsername(nickname: string): string {
  const base = nickname.replace(/[^a-zA-Z0-9一-龥_-]/g, '').slice(0, 12) || '用户';
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(base);
  if (!existing) return base;
  return `${base}_${Date.now().toString(36)}`;
}

export default router;
