import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw, Zap, X, HardDrive, CheckCircle2 } from 'lucide-react';
import { useOnlineSync } from '../hooks/useOnlineSync';
import { User } from '../types';

interface OfflineIndicatorProps {
  currentUser?: User | null;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ currentUser }) => {
  const { isOnline, isSyncing, syncNow, lastSyncTime } = useOnlineSync(currentUser);
  const [dismissed, setDismissed] = useState(false);
  const [justCameOnline, setJustCameOnline] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setDismissed(false);
      setJustCameOnline(true);
      const timer = setTimeout(() => setJustCameOnline(false), 4500);
      return () => clearTimeout(timer);
    } else {
      setDismissed(false);
      setJustCameOnline(false);
    }
  }, [isOnline]);

  if (dismissed && !justCameOnline) return null;

  // Banner when connection restored and instant sync executed
  if (justCameOnline) {
    return (
      <aside
        aria-label="Online synchronization status"
        className="fixed bottom-4 right-4 z-50 max-w-md bg-emerald-950/95 border border-emerald-500/80 rounded-2xl p-3.5 shadow-2xl text-xs text-white backdrop-blur-md animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Back Online — Instant Sync Complete</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Local device resources and ledger entries successfully verified with central system at{' '}
                {new Date(lastSyncTime).toLocaleTimeString('en-GB')}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setJustCameOnline(false)}
            aria-label="Close notification"
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Banner when offline
  if (!isOnline) {
    return (
      <aside
        aria-label="Offline mode status"
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 max-w-md bg-slate-900/95 border border-amber-500/70 rounded-2xl p-3.5 shadow-2xl text-xs text-white backdrop-blur-md animate-in slide-in-from-bottom duration-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Offline Mode Active — Local Device Resources Ready</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                Your device has all financial statements, expenses, and member records cached. System is 100% operational offline and will sync instantly upon reconnecting.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              aria-label="Retry connection"
              title="Test connection and sync"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss offline banner"
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return null;
};
