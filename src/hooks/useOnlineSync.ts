import { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { User } from '../types';

export function useOnlineSync(currentUser?: User | null) {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => storageService.getLastSyncTime());
  const [syncFeedback, setSyncFeedback] = useState<string>('');
  const [storageUsedKB, setStorageUsedKB] = useState<number>(0);

  const performSync = useCallback(
    (isAutomatic = false) => {
      setIsSyncing(true);
      try {
        const res = storageService.syncLocalDataWithCloud(currentUser || undefined);
        setLastSyncTime(res.syncedAt);
        setStorageUsedKB(res.storageUsedKB);
        setSyncFeedback(
          isAutomatic
            ? '⚡ Connected Online — Device synchronized instantly with central society server!'
            : '⚡ Instant sync successful! All local records are verified and up to date.'
        );
        setTimeout(() => setSyncFeedback(''), 4500);
      } catch (err: any) {
        console.error('Instant sync failed:', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Instant synchronization upon regaining network connection!
      performSync(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncFeedback('📶 Offline Mode Active — Local device storage is active. All records remain fully functional.');
      setTimeout(() => setSyncFeedback(''), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of storage footprint
    const stats = storageService.getOfflineSystemStats();
    setStorageUsedKB(stats.storageUsedKB);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  return {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncFeedback,
    storageUsedKB,
    syncNow: () => performSync(false),
  };
}
