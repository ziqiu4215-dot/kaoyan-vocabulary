import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

type Tab = 'password' | 'phone' | 'oauth';

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('password');
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">登录 研词</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {([
            ['password', '密码登录'],
            ['phone', '手机号登录'],
            ['oauth', 'QQ / 微信'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'password' && <PasswordLogin login={login} navigate={navigate} />}
        {tab === 'phone' && <PhoneLogin />}
        {tab === 'oauth' && <OAuthLogin />}
      </div>
    </div>
  );
}

// ─── 密码登录 ───

function PasswordLogin({ login, navigate }: { login: any; navigate: any }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) { setError('请填写用户名和密码'); return; }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">用户名 / 邮箱</label>
        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input" placeholder="请输入用户名或邮箱" autoFocus />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="请输入密码" />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '...' : '登录'}</button>
      <p className="text-center text-sm text-gray-400">
        还没有账号？<Link to="/register" className="text-brand-600 hover:underline">去注册</Link>
      </p>
    </form>
  );
}

// ─── 手机号登录 ───

function PhoneLogin() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const sendSms = async () => {
    if (!phone || countdown > 0) return;
    setError('');
    try {
      const res = await api.post('/auth/send-sms', { phone });
      setMsg(res.data.data?.code ? `验证码: ${res.data.data.code}（开发模式）` : '验证码已发送');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((c) => { if (c <= 1) { clearInterval(timer); return 0; } return c - 1; });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) { setError('请输入手机号和验证码'); return; }
    setError(''); setMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login-by-phone', { phone, code });
      const { token } = res.data.data;
      localStorage.setItem('kaoyan-token', token);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">{error}</div>}
      {msg && <div className="bg-green-50 text-green-600 text-sm px-3 py-2 rounded-lg">{msg}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="请输入手机号" autoFocus />
      </div>
      <div className="flex gap-2">
        <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="input flex-1" placeholder="验证码" />
        <button type="button" onClick={sendSms} disabled={countdown > 0} className="btn-secondary shrink-0 text-xs">
          {countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? '...' : '登录 / 注册'}</button>
      <p className="text-xs text-gray-400 text-center">首次登录将自动创建账号</p>
    </form>
  );
}

// ─── QQ / 微信登录 ───

function OAuthLogin() {
  const [error, setError] = useState('');

  const doOAuth = async (provider: 'qq' | 'wechat') => {
    setError('');
    try {
      const res = await api.get(`/auth/${provider}/url`);
      if (res.data.success) {
        window.location.href = res.data.data.url;
      } else {
        setError(res.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `${provider} 登录暂不可用`);
    }
  };

  return (
    <div className="card p-6 space-y-4">
      {error && <div className="bg-amber-50 text-amber-600 text-sm px-3 py-2 rounded-lg">{error}</div>}

      <button
        onClick={() => doOAuth('qq')}
        className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        style={{ background: '#12B7F5', color: '#fff' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M21 12.5c0 5-5 9-9 9-1.2 0-2.3-.3-3.3-.7l-3 1 .9-2.8C5.4 17.8 5 16.7 5 15.5c0-5 5-9 9-9s7 4 7 6z"/></svg>
        QQ 登录
      </button>

      <button
        onClick={() => doOAuth('wechat')}
        className="w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
        style={{ background: '#07C160', color: '#fff' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM12 2C6.5 2 2 6 2 10.7c0 2.7 1.2 5 3 6.5l-1 3 3.5-1.5c1.3.4 2.8.7 4.5.7 5.5 0 10-4 10-8.7S17.5 2 12 2z"/></svg>
        微信登录
      </button>

      <p className="text-xs text-gray-400 text-center">
        需要在 QQ 互联 / 微信开放平台配置 App ID 后才能使用
      </p>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-center text-sm text-gray-400">
          <Link to="/register" className="text-brand-600 hover:underline">邮箱注册</Link>
        </p>
      </div>
    </div>
  );
}
