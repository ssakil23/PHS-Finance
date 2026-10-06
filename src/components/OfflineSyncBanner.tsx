import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, HardDrive, ShieldCheck, X } from 'lucide-react';
import { useOnlineSync } from '../hooks/useOnlineSync';
import { User } from '../types';

interface OfflineSyncBannerProps {
  currentUser?: User | null;
}

export const OfflineSyncBanner: React.FC<OfflineSyncBannerProps> = ({ currentUser }) => {
  const { isOnline, isSyncing, syncFeedback, storageUsedKB, syncNow } = useOnlineSync(currentUser);
  const [dismissed, setDismissed] = React.useState(false);

  // If online and no notification, keep banner folded
  if (isOnline && !syncFeedback) {
    return null;
  }

  if (dismissed && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-3.5 rounded-2xl shadow-2xl border flex items-start gap-3 animate-in slide-in-from-bottom duration-300 ${
        isOnline
          ? 'bg-slate-900 border-emerald-500/60 text-emerald-200'
          : 'bg-slate-900 border-amber-500/70 text-amber-200'
      }`}
    >
      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 shrink-0 mt-0.5">
        {isOnline ? (
          <Wifi className="w-4 h-4 text-emerald-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
        )}
      </div>

      <div className="flex-1 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-bold text-white flex items-center gap-1.5">
            {isOnline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Cloud Sync Active</span>
              </>
            ) : (
              <>
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                <span>Fast Device Offline Mode</span>
              </>
            )}
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-white p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-300 leading-snug">
          {syncFeedback ||
            (isOnline
              ? 'Local device resources are synchronized with the central society server.'
              : 'Network disconnected. Local device storage is keeping PHS-Finance 100% alive & responsive.')}
        </p>

        <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Device Storage: {storageUsedKB} KB</span>
          </span>

          {isOnline && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
