import { useI18n } from '../i18n';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { lang, setLang } = useI18n();
  const { isAuthenticated } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">{lang === 'zh' ? '设置' : 'Settings'}</h1>

      {/* Language */}
      <div className="card p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{lang === 'zh' ? '语言' : 'Language'}</p>
            <p className="text-xs text-gray-400">{lang === 'zh' ? '中文 / English' : 'Chinese / English'}</p>
          </div>
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="btn-secondary text-xs px-4 py-2"
          >
            {lang === 'zh' ? '切换到 English' : 'Switch to 中文'}
          </button>
        </div>
      </div>

      {/* Learning Goal */}
      <div className="card p-4 mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900">{lang === 'zh' ? '每日目标' : 'Daily Goal'}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {lang === 'zh' ? '建议每天 20-30 个新词 + 复习' : 'Recommended 20-30 new words + review daily'}
          </p>
        </div>
      </div>

      {/* Sound */}
      <div className="card p-4 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{lang === 'zh' ? '音效' : 'Sound Effects'}</p>
            <p className="text-xs text-gray-400">{lang === 'zh' ? '答题和升级时的声音' : 'Feedback sounds for answers and level-ups'}</p>
          </div>
          <div className="w-10 h-6 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Account */}
      {isAuthenticated && (
        <div className="card p-4 mb-3">
          <p className="text-sm font-medium text-red-600">{lang === 'zh' ? '退出登录' : 'Sign Out'}</p>
        </div>
      )}

      {/* About */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">研词 v2.0</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {lang === 'zh' ? '考研英语单词 · 语境记忆 · 间隔重复' : 'Kaoyan Vocabulary · Context · SRS'}
        </p>
      </div>
    </div>
  );
}
