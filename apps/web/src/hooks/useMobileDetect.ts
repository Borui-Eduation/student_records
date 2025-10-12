'use client';

import { useEffect, useState } from 'react';

export interface MobileDetect {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isPWA: boolean;
}

/**
 * Hook to detect mobile device and platform
 */
export function useMobileDetect(): MobileDetect {
  const [deviceInfo, setDeviceInfo] = useState<MobileDetect>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isTouchDevice: false,
    isIOS: false,
    isAndroid: false,
    isPWA: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const ua = navigator.userAgent;
    
    // Detect mobile
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    
    // Detect tablet
    const isTabletDevice = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);
    
    // Detect touch support
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Detect platform
    const isIOS = /iPhone|iPad|iPod/i.test(ua);
    const isAndroid = /Android/i.test(ua);
    
    // Detect PWA mode
    const isPWA = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setDeviceInfo({
      isMobile: isMobileDevice && !isTabletDevice,
      isTablet: isTabletDevice,
      isDesktop: !isMobileDevice && !isTabletDevice,
      isTouchDevice,
      isIOS,
      isAndroid,
      isPWA,
    });
  }, []);

  return deviceInfo;
}




