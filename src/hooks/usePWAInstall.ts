import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'phs_pwa_install_banner_dismissed_until';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [platformLabel, setPlatformLabel] = useState<string>('Desktop');
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (!stored) return false;
      const dismissedUntil = parseInt(stored, 10);
      return Date.now() < dismissedUntil;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    // Detect standalone mode (already installed as PWA or running as standalone window)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: window-controls-overlay)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://'));

    setIsInstalled(isStandalone);

    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isAndroidDevice = /android/.test(ua);
      const isMobileDevice = isIOSDevice || isAndroidDevice || /mobile/.test(ua);

      setIsIOS(isIOSDevice);
      setIsAndroid(isAndroidDevice);
      setIsDesktop(!isMobileDevice);

      if (isAndroidDevice) {
        setPlatformLabel('Android');
      } else if (isIOSDevice) {
        setPlatformLabel('iOS');
      } else if (/macintosh|mac os x/.test(ua)) {
        setPlatformLabel('macOS');
      } else if (/windows/.test(ua)) {
        setPlatformLabel('Windows');
      } else if (/linux/.test(ua)) {
        setPlatformLabel('Linux');
      } else {
        setPlatformLabel('Desktop');
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.removeItem(DISMISS_KEY);
      } catch {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('PWA prompt execution error:', err);
      return false;
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback((temporary: boolean = true) => {
    setIsBannerDismissed(true);
    try {
      if (temporary) {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
      } else {
        localStorage.setItem(DISMISS_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      }
    } catch {}
  }, []);

  const resetDismissed = useCallback(() => {
    setIsBannerDismissed(false);
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {}
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    platformLabel,
    isBannerDismissed,
    install,
    dismissBanner,
    resetDismissed,
  };
}
