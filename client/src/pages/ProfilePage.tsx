import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useResponsive } from '../hooks/useResponsive';
import { useStore } from '../store/useStore';
import { getUserProfile, updateUserProfile, changePassword, getMyRank, getLevelLeaderboard } from '../services/api';
import { getLevelProgress, getTitle } from '../lib/xp';
import LevelRing from '../components/LevelRing';
import api from '../services/api';

interface ProfileData {
  id: number;
  username: string;
  email: string;
  phone?: string;
  avatar: string;
  oauthProvider?: string;
  createdAt: string;
  xp: number;
  level: number;
  streak: number;
  achievements: Array<{ key: string; name: string; icon: string; unlockedAt: string }>;
}

export default function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { isAuthenticated, logout, updateUser } = useAuth();
  const { show: showToast } = useToast();
  const { isPhone } = useResponsive();
  const navigate = useNavigate();

  const dailyGoal = useStore((s) => s.dailyGoal);
  const setDailyGoal = useStore((s) => s.setDailyGoal);
  const soundEnabled = useStore((s) => s.soundEnabled);
  const setSoundEnabled = useStore((s) => s.setSoundEnabled);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRank, setMyRank] = useState<{ rank: number; xp: number; level: number } | null>(null);
  const [topUsers, setTopUsers] = useState<Array<{ rank: number; username: string; xp: number; level: number }>>([]);

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Phone binding state
  const [phoneEditing, setPhoneEditing] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsCountdown, setSmsCountdown] = useState(0);

  // Password state
  const [pwExpanded, setPwExpanded] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  // Logout confirm
  const [logoutConfirming, setLogoutConfirming] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await getUserProfile();
      if (res.success) setProfile(res.data);
    } catch {
      showToast(t('settings.updateError'), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, t]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchProfile();
    // Fetch leaderboard preview
    getMyRank().then(r => { if (r.success) setMyRank(r.data); }).catch(() => {});
    getLevelLeaderboard(3).then(r => { if (r.success) setTopUsers(r.data.users || []); }).catch(() => {});
  }, [isAuthenticated, fetchProfile]);

  // SMS countdown
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setInterval(() => setSmsCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [smsCountdown]);

  // ─── Handlers ───

  const startEdit = () => {
    if (!profile) return;
    setEditUsername(profile.username);
    setEditEmail(profile.email);
    setEditAvatar(profile.avatar || '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditUsername('');
    setEditEmail('');
    setEditAvatar('');
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await updateUserProfile({
        username: editUsername,
        email: editEmail,
        avatar: editAvatar,
      });
      if (res.success) {
        updateUser(res.data);
        setProfile((prev) => prev ? { ...prev, ...res.data } : null);
        setEditing(false);
        showToast(t('settings.updated'), 'success');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('用户名')) showToast(t('settings.usernameTaken'), 'error');
      else if (msg?.includes('邮箱')) showToast(t('settings.emailTaken'), 'error');
      else showToast(t('settings.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendSms = async () => {
    if (smsCountdown > 0 || !editPhone) return;
    try {
      await api.post('/auth/send-sms', { phone: editPhone });
      showToast(lang === 'zh' ? '验证码已发送' : 'Code sent', 'success');
      setSmsCountdown(60);
    } catch {
      showToast(lang === 'zh' ? '发送失败' : 'Send failed', 'error');
    }
  };

  const handleBindPhone = async () => {
    if (!editPhone || !smsCode) return;
    try {
      await api.post('/auth/bind-phone', { phone: editPhone, code: smsCode });
      showToast(t('settings.phoneBound'), 'success');
      setProfile((prev) => prev ? { ...prev, phone: editPhone } : null);
      setPhoneEditing(false);
      setSmsCode('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || t('settings.updateError'), 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw) return;
    setPwSaving(true);
    try {
      await changePassword({ currentPassword: currentPw, newPassword: newPw });
      showToast(t('settings.passwordChanged'), 'success');
      setPwExpanded(false);
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg?.includes('当前密码') || msg?.includes('incorrect')) {
        showToast(t('settings.passwordMismatch'), 'error');
      } else {
        showToast(msg || t('settings.updateError'), 'error');
      }
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    showToast(lang === 'zh' ? '已退出登录' : 'Signed out', 'info');
    navigate('/');
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US');
    } catch {
      return dateStr;
    }
  };

  // ─── Loading / Not authenticated ───

  if (loading) {
    return (
      <div className="px-4 py-12 text-center text-sm text-gray-400">
        <div className="animate-spin w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-2" />
        {t('common.loading')}
      </div>
    );
  }

  if (!isAuthenticated || !profile) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>
        <div className="card p-8 text-center">
          <p className="text-gray-400 text-sm mb-4">{lang === 'zh' ? '请先登录' : 'Please sign in first'}</p>
          <button onClick={() => navigate('/login')} className="btn-primary text-sm px-6 py-2">
            {lang === 'zh' ? '去登录' : 'Sign In'}
          </button>
        </div>
      </div>
    );
  }

  const progress = getLevelProgress(profile.xp);
  const levelTitle = getTitle(profile.level);

  // ─── Render ───

  return (
    <div className="px-4 py-6 sm:px-6 max-w-content-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{t('settings.title')}</h1>

      <div className={`${isPhone ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Left column */}
        <div className="space-y-4">
          {/* ─── Profile Card ─── */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">{t('settings.profile')}</h2>
              {!editing && (
                <button onClick={startEdit} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  {t('settings.edit')}
                </button>
              )}
            </div>

            {editing ? (
              /* Edit mode */
              <div className="space-y-3">
                {/* Avatar preview + URL */}
                <div className="flex items-center gap-3">
                  {editAvatar ? (
                    <img src={editAvatar} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-gray-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-lg font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="text-xs text-gray-400">{t('settings.avatar')}</label>
                    <input
                      className="input w-full text-sm mt-0.5"
                      value={editAvatar}
                      onChange={(e) => setEditAvatar(e.target.value)}
                      placeholder={t('settings.avatarPlaceholder')}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-400">{t('settings.username')}</label>
                  <input
                    className="input w-full text-sm mt-0.5"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    minLength={2}
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400">{t('settings.email')}</label>
                  <input
                    className="input w-full text-sm mt-0.5"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    type="email"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={cancelEdit} className="btn-ghost text-xs px-4 py-2 flex-1">
                    {t('settings.cancel')}
                  </button>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-xs px-4 py-2 flex-1">
                    {saving ? t('settings.saving') : t('settings.save')}
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-gray-100" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xl font-bold shrink-0">
                      {profile.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{profile.username}</p>
                    <p className="text-xs text-amber-600 font-medium">{levelTitle}</p>
                    {profile.oauthProvider && (
                      <span className="text-xs text-gray-400">
                        {profile.oauthProvider === 'qq' ? 'QQ' : '微信'} {lang === 'zh' ? '登录' : 'Login'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-gray-400">{t('settings.email')}</span>
                    <p className="text-gray-700 truncate">{profile.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400">{t('settings.phone')}</span>
                    <p className="text-gray-700">{profile.phone || t('settings.phoneNotBound')}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400">{t('settings.joinDate')}</span>
                    <p className="text-gray-700">{formatDate(profile.createdAt)}</p>
                  </div>
                </div>

                {/* Phone binding (in view mode) */}
                {!phoneEditing ? (
                  <button
                    onClick={() => {
                      setEditPhone(profile.phone || '');
                      setPhoneEditing(true);
                    }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    {profile.phone ? (lang === 'zh' ? '更换手机号' : 'Change Phone') : (lang === 'zh' ? '绑定手机号' : 'Bind Phone')}
                  </button>
                ) : (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <input
                      className="input w-full text-sm"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder={t('settings.phonePlaceholder')}
                    />
                    <div className="flex gap-2">
                      <input
                        className="input flex-1 text-sm"
                        value={smsCode}
                        onChange={(e) => setSmsCode(e.target.value)}
                        placeholder={lang === 'zh' ? '验证码' : 'SMS Code'}
                        maxLength={6}
                      />
                      <button
                        onClick={handleSendSms}
                        disabled={smsCountdown > 0}
                        className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap"
                      >
                        {smsCountdown > 0 ? t('settings.retryAfter', { s: String(smsCountdown) }) : t('settings.getCode')}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setPhoneEditing(false)} className="btn-ghost text-xs px-3 py-1.5 flex-1">
                        {t('settings.cancel')}
                      </button>
                      <button onClick={handleBindPhone} className="btn-primary text-xs px-3 py-1.5 flex-1">
                        {t('settings.save')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Learning Stats Card ─── */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.stats')}</h2>

            <div className="flex items-center gap-4 mb-4">
              <LevelRing xp={profile.xp} size="md" />
              <div>
                <p className="text-lg font-bold text-gray-900">
                  <span className="text-brand-600">{profile.xp}</span>
                  <span className="text-xs text-gray-400 font-normal"> XP</span>
                </p>
                <p className="text-sm text-gray-600">
                  Lv.{profile.level}
                  <span className="text-xs text-gray-400 ml-1">— {progress.pct}%</span>
                </p>
                {/* XP progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-amber-50 rounded-lg py-2">
                <p className="text-lg font-bold text-amber-600">{profile.streak}</p>
                <p className="text-xs text-amber-500">{t('settings.streak')}</p>
              </div>
              <div className="bg-brand-50 rounded-lg py-2">
                <p className="text-lg font-bold text-brand-600">{profile.level}</p>
                <p className="text-xs text-brand-500">{t('settings.level')}</p>
              </div>
              <div className="bg-green-50 rounded-lg py-2">
                <p className="text-lg font-bold text-green-600">{profile.achievements.length}</p>
                <p className="text-xs text-green-500">{t('settings.achievements')}</p>
              </div>
            </div>

            {/* Achievements */}
            {profile.achievements.length > 0 ? (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">
                  {t('settings.achievementsUnlocked', { count: String(profile.achievements.length), total: '9' })}
                </p>
                <div className="flex flex-wrap gap-2">
                  {profile.achievements.map((a) => (
                    <span key={a.key} className="inline-flex items-center gap-1 text-xs bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1">
                      <span>{a.icon}</span>
                      <span className="text-gray-600">{a.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">{t('settings.noAchievements')}</p>
            )}

            <button
              onClick={() => navigate('/stats')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium mt-3 inline-block"
            >
              {t('settings.viewDetailedStats')}
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* ─── Leaderboard Card ─── */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">🏆 {lang === 'zh' ? '排行榜' : 'Leaderboard'}</h2>

            {/* My rank */}
            {myRank && (
              <div className="flex items-center gap-3 bg-brand-50 rounded-lg px-3 py-2 mb-3">
                <span className="text-lg font-bold text-brand-600">#{myRank.rank}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{profile?.username}</p>
                  <p className="text-xs text-gray-400">Lv.{myRank.level} · {myRank.xp} XP</p>
                </div>
              </div>
            )}

            {/* Top 3 */}
            {topUsers.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {topUsers.map((u, i) => (
                  <div key={u.rank} className="flex items-center gap-2 text-sm">
                    <span className={`w-5 text-center font-bold text-xs ${
                      i === 0 ? 'text-amber-500' : i === 1 ? 'text-gray-400' : 'text-amber-700'
                    }`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="flex-1 truncate text-gray-700">{u.username}</span>
                    <span className="text-xs text-gray-400">Lv.{u.level}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => navigate('/leaderboard')}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              {lang === 'zh' ? '查看完整排行 →' : 'View Full Leaderboard →'}
            </button>
          </div>

          {/* ─── Preferences Card ─── */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.preferences')}</h2>

            {/* Language */}
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-900">{t('settings.language')}</p>
                <p className="text-xs text-gray-400">{t('settings.languageDesc')}</p>
              </div>
              <button
                onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
                className="btn-secondary text-xs px-4 py-1.5"
              >
                {t('settings.switchLang')}
              </button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm text-gray-900">{t('settings.sound')}</p>
                <p className="text-xs text-gray-400">{t('settings.soundDesc')}</p>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  soundEnabled ? 'bg-brand-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    soundEnabled ? 'translate-x-5.5' : 'translate-x-0.5'
                  }`}
                  style={{ left: 0 }}
                />
              </button>
            </div>

            {/* Daily Goal */}
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-gray-900">{t('settings.dailyGoal')}</p>
                <p className="text-xs text-gray-400">{t('settings.dailyGoalDesc')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDailyGoal(Math.max(5, dailyGoal - 5))}
                  className="w-7 h-7 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 text-sm flex items-center justify-center"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-gray-900 w-8 text-center">
                  {dailyGoal}
                </span>
                <button
                  onClick={() => setDailyGoal(Math.min(200, dailyGoal + 5))}
                  className="w-7 h-7 rounded-full border border-gray-200 text-gray-400 hover:text-gray-600 text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ─── Account Card ─── */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.account')}</h2>

            {/* Change Password */}
            <div className="border-b border-gray-50 pb-3 mb-3">
              <button
                onClick={() => setPwExpanded(!pwExpanded)}
                className="text-sm text-gray-900 hover:text-brand-600 transition-colors w-full text-left flex items-center justify-between"
              >
                {t('settings.changePassword')}
                <span className={`text-gray-400 transition-transform ${pwExpanded ? 'rotate-90' : ''}`}>›</span>
              </button>
              {pwExpanded && (
                <div className="mt-3 space-y-3">
                  <input
                    className="input w-full text-sm"
                    type="password"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    placeholder={t('settings.currentPassword')}
                  />
                  <input
                    className="input w-full text-sm"
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder={t('settings.newPassword')}
                    minLength={6}
                  />
                  <button
                    onClick={handleChangePassword}
                    disabled={pwSaving}
                    className="btn-primary text-xs px-4 py-2 w-full"
                  >
                    {pwSaving ? t('settings.saving') : t('settings.save')}
                  </button>
                </div>
              )}
            </div>

            {/* Logout */}
            {!logoutConfirming ? (
              <button
                onClick={() => setLogoutConfirming(true)}
                className="text-sm text-red-600 hover:text-red-700 font-medium w-full text-left"
              >
                {t('settings.logout')}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('settings.logoutConfirm')}</span>
                <button onClick={handleLogout} className="btn-danger text-xs px-3 py-1">
                  {t('settings.logout')}
                </button>
                <button onClick={() => setLogoutConfirming(false)} className="btn-ghost text-xs px-3 py-1">
                  {t('settings.cancel')}
                </button>
              </div>
            )}
          </div>

          {/* ─── About Card ─── */}
          <div className="card p-4 text-center">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">{t('settings.about')}</h2>
            <p className="text-xs text-gray-400">{t('settings.version')}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t('settings.tagline')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
