import React, { useState } from 'react';
import { Download, Smartphone, X, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install PHS-Finance as standalone app on this device for instant offline access"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition animate-in fade-in"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install Offline App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install PHS-Finance on iPhone / iPad home screen"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Install iOS App</span>
          <span className="sm:hidden">Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs space-y-3 leading-relaxed">
                <p className="text-slate-300">
                  Follow these 2 quick steps in iOS Safari to run PHS-Finance as a native offline application:
                </p>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>Share</strong> button (box with upward arrow) at the bottom toolbar of Safari.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Provides fast instant offline access and device caching.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
