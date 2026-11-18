import { useEffect, useState } from 'react';

export function useDeviceQuality() {
  const [lowPower, setLowPower] = useState(() => getLowPower());

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const update = () => setLowPower(getLowPower());
    media.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      media.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return { lowPower };
}

function getLowPower(): boolean {
  const width = window.innerWidth;
  const ratio = window.devicePixelRatio || 1;
  return width < 768 || (width < 1024 && ratio >= 2);
}
