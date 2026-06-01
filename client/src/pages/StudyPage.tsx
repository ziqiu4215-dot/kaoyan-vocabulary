import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import LearnPage from './LearnPage';
import ReviewPage from './ReviewPage';

export default function StudyPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'review' ? 'review' : 'learn';
  const [tab, setTab] = useState<'learn' | 'review'>(initialTab);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 px-4 sm:px-6 pt-4">
        {([
          ['learn', '新学'],
          ['review', '复习'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'learn' ? <LearnPage /> : <ReviewPage />}
    </div>
  );
}
