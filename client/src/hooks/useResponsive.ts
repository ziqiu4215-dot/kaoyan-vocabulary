import { useState, useEffect } from 'react';

type Device = 'phone' | 'tablet' | 'desktop';

export function useResponsive(): { device: Device; isPhone: boolean; isTablet: boolean; isDesktop: boolean } {
  const [device, setDevice] = useState<Device>(() => {
    if (typeof window === 'undefined') return 'phone';
    const w = window.innerWidth;
    if (w >= 1280) return 'desktop';
    if (w >= 768) return 'tablet';
    return 'phone';
  });

  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      if (w >= 1280) setDevice('desktop');
      else if (w >= 768) setDevice('tablet');
      else setDevice('phone');
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return {
    device,
    isPhone: device === 'phone',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
  };
}
