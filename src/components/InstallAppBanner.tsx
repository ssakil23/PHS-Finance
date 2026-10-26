import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  Share2,
  PlusSquare,
  Sparkles,
  ShieldCheck,
  Zap,
  HardDrive,
  ChevronRight,
  Info,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppBannerProps {
  /**
   * If true, also shows guided installation instructions for iOS devices
   * where the WebKit engine does not support the BeforeInstallPromptEvent API.
   * Defaults to true.
   */
  allowIOSGuide?: boolean;
  /**
   * Optional callback when user triggers installation
   */
  onInstallSuccess?: () => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({
  allowIOSGuide = true,
  onInstallSuccess,
}) => {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    platformLabel,
    isBannerDismissed,
    install,
    dismissBanner,
    resetDismissed,
  } = usePWAInstall();

  const [isInstalling, setIsInstalling] = useState(false);
  const [showPlatformGuide, setShowPlatformGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<'AUTO' | 'CHROME' | 'IOS' | 'EDGE'>('AUTO');

  // If already running inside installed standalone PWA, completely suppress
  if (isInstalled) {
    return null;
  }

  // Check visibility conditions:
  // 1. Must be promptable via beforeinstallprompt (isInstallable) OR iOS device requesting guide
  const shouldShow = (isInstallable || (allowIOSGuide && isIOS)) && !isBannerDismissed;

  // If user dismissed the banner, render a discrete floating trigger badge so they can still install anytime
  if (!shouldShow) {
    if ((isInstallable || isIOS) && isBannerDismissed) {
      return (
        <aside
          aria-label="Install App Quick Access"
          className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-300 print:hidden"
        >
          <button
            onClick={() => resetDismissed()}
            title="Install PHS-Finance as standalone desktop or mobile application"
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 hover:bg-slate-800 text-emerald-400 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-xs font-semibold shadow-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
            <span className="font-mono text-[11px]">Install App</span>
          </button>
        </aside>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          onInstallSuccess?.();
        }
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowPlatformGuide(true);
      setGuidePlatform('IOS');
    }
  };

  return (
    <>
      <aside
        aria-label="PWA Application Installation Banner"
        className="fixed bottom-3 left-3 right-3 md:left-auto md:right-6 md:bottom-6 md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden"
      >
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/95 border border-emerald-500/60 p-4 md:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-emerald-500/20 text-slate-100">
          {/* Subtle glowing ambient accent */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative flex items-start gap-3.5">
            {/* App Icon Monogram Badge */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 border border-emerald-400/40 p-0.5 shadow-lg flex items-center justify-center text-white">
                <div className="w-full h-full rounded-[10px] bg-slate-950/70 flex flex-col items-center justify-center">
                  <span className="font-black text-xs md:text-sm tracking-wider text-emerald-300 font-mono">
                    PHS
                  </span>
                  <span className="text-[7px] text-slate-400 font-semibold uppercase tracking-tighter">
                    Finance
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-emerald-500 text-slate-950 border border-slate-900 shadow">
                {isDesktop ? (
                  <Monitor className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <Smartphone className="w-3 h-3 stroke-[2.5]" />
                )}
              </span>
            </div>

            {/* Banner Main Content */}
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>Install PHS-Finance</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                    {platformLabel} App
                  </span>
                </h4>
              </div>

              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {isDesktop
                  ? 'Install as a dedicated desktop application with native window controls, desktop launch icon, and offline ledger support.'
                  : isIOS
                  ? 'Add to your iPhone or iPad home screen for full-screen offline access without browser URL bars.'
                  : 'Add to your home screen & app drawer for 1-tap instant biometric launch and full offline access.'}
              </p>

              {/* Value Proposition Tags */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-200">
                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Instant Launch</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-200">
                  <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>100% Offline Ledger</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-200">
                  <ShieldCheck className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>PIN Protected</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 hover:shadow-emerald-900/60 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download className={`w-3.5 h-3.5 ${isInstalling ? 'animate-bounce' : ''}`} />
                  <span>{isInstalling ? 'Prompting...' : isIOS ? 'View Install Steps' : 'Install App Now'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPlatformGuide(true);
                    setGuidePlatform(isIOS ? 'IOS' : 'AUTO');
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-colors"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => dismissBanner(true)}
                  className="px-2.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors ml-auto"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Close / Dismiss Button */}
            <button
              type="button"
              onClick={() => dismissBanner(true)}
              aria-label="Dismiss Install App Banner"
              className="absolute top-0 right-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Interactive Platform Installation Guide Modal */}
      {showPlatformGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="install-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-5 md:p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {guidePlatform === 'IOS' ? (
                    <Smartphone className="w-5 h-5" />
                  ) : (
                    <Monitor className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 id="install-guide-title" className="text-sm md:text-base font-bold text-white">
                    Installation Guidelines
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Run PHS-Finance as a standalone zero-lag app
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPlatformGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setGuidePlatform('AUTO')}
                className={`py-1.5 px-2 rounded-lg font-medium transition ${
                  guidePlatform === 'AUTO'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('CHROME')}
                className={`py-1.5 px-2 rounded-lg font-medium transition ${
                  guidePlatform === 'CHROME'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Android
              </button>
              <button
                type="button"
                onClick={() => setGuidePlatform('IOS')}
                className={`py-1.5 px-2 rounded-lg font-medium transition ${
                  guidePlatform === 'IOS'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                iPhone / iPad
              </button>
            </div>

            {/* Desktop Instructions */}
            {guidePlatform === 'AUTO' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Google Chrome & Microsoft Edge on Windows, macOS, or Linux:
                </p>
                <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Click the <strong>Install</strong> icon in the address bar (on the right side next to the bookmark star), or click the primary <strong>Install App Now</strong> button below.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Click <strong>Install</strong> when prompted. The application will launch in its own dedicated, chromeless window and pin to your Taskbar or Dock.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Android Instructions */}
            {guidePlatform === 'CHROME' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Google Chrome or Samsung Internet on Android:
                </p>
                <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>Install App Now</strong> banner or tap the 3-dots menu <strong className="text-slate-200">⋮</strong> in Chrome.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Select <strong>Add to Home Screen</strong> or <strong>Install App</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* iOS Instructions */}
            {guidePlatform === 'IOS' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-300">
                  Apple iOS Safari (iPhone / iPad):
                </p>
                <div className="space-y-2.5 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong className="inline-flex items-center gap-1 text-slate-100"><Share2 className="w-3.5 h-3.5 text-blue-400" /> Share</strong> button in Safari's bottom toolbar.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down the share sheet and tap <strong className="inline-flex items-center gap-1 text-slate-100"><PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> Add to Home Screen</strong>.
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong>Add</strong> in the top-right corner to complete installation.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Once installed, PHS-Finance will cache all society ledgers, 144-share calculations, and member statements locally for instantaneous offline use.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    setShowPlatformGuide(false);
                    await handleInstallClick();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Trigger Browser Install</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPlatformGuide(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
