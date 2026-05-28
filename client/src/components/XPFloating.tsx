import { useEffect, useState } from 'react';

interface Props {
  xp: number;
  label?: string;
  onDone?: () => void;
}

export default function XPFloating({ xp, label, onDone }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1200);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="animate-bounce-in flex flex-col items-center">
        <span className="text-3xl font-bold text-green-500 drop-shadow-lg">
          +{xp} XP
        </span>
        {label && (
          <span className="text-sm text-gray-500 mt-1 bg-white/80 px-3 py-0.5 rounded-full">
            {label}
          </span>
        )}
      </div>
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.3) translateY(0); opacity: 0; }
          30% { transform: scale(1.15) translateY(-10px); opacity: 1; }
          60% { transform: scale(0.95) translateY(-20px); opacity: 1; }
          100% { transform: scale(1) translateY(-30px); opacity: 0; }
        }
        .animate-bounce-in { animation: bounce-in 1.2s ease-out forwards; }
      `}</style>
    </div>
  );
}
