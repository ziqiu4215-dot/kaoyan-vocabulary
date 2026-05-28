import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import zh from './zh';
import en from './en';
import type { I18nMessages } from './zh';

type Lang = 'zh' | 'en';

const messages: Record<Lang, I18nMessages> = { zh, en };

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem('kaoyan-lang');
    if (stored === 'en' || stored === 'zh') return stored;
  } catch { /* ignore */ }
  return 'zh';
}

interface I18nContextType {
  lang: Lang;
  t: (key: keyof I18nMessages, params?: Record<string, string | number>) => string;
  setLang: (l: Lang) => void;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('kaoyan-lang', l); } catch { /* ignore */ }
  }, []);

  const t = useCallback(
    (key: keyof I18nMessages, params?: Record<string, string | number>) => {
      let text = messages[lang][key] || messages.zh[key] || key;
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
