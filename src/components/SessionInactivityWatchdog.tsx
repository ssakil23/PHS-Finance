import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { User } from '../types';

interface SessionInactivityWatchdogProps {
  currentUser: User | null;
  timeoutMinutes?: number; // default 20 minutes
  warningSeconds?: number; // default 60 seconds
}

export const SessionInactivityWatchdog: React.FC<SessionInactivityWatchdogProps> = ({
  currentUser,
  timeoutMinutes = 20,
  warningSeconds = 60,
}) => {
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(warningSeconds);

  const lastActivityRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningModal) {
      setShowWarningModal(false);
      setSecondsRemaining(warningSeconds);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }
  }, [showWarningModal, warningSeconds]);

  // Listen to user interactions across the application
  useEffect(() => {
    if (!currentUser) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    const handleUserActivity = () => {
      // If modal is not currently open, keep refreshing activity timestamp
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check inactivity periodically every 10 seconds
    const interval = setInterval(() => {
      if (!currentUser || showWarningModal) return;

      const inactiveDurationMs = Date.now() - lastActivityRef.current;
      const timeoutThresholdMs = (timeoutMinutes * 60 - warningSeconds) * 1000;

      if (inactiveDurationMs >= timeoutThresholdMs) {
        setShowWarningModal(true);
        setSecondsRemaining(warningSeconds);
      }
    }, 10000);

    return () => {
      events.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      clearInterval(interval);
    };
  }, [currentUser, showWarningModal, timeoutMinutes, warningSeconds]);

  // Warning countdown timer
  useEffect(() => {
    if (!showWarningModal) return;

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          handleExecuteAutoLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [showWarningModal]);

  const handleExecuteAutoLogout = () => {
    if (currentUser) {
      storageService.logAudit(
        currentUser,
        'LOGIN',
        'USER',
        currentUser.id,
        `Session Watchdog: Automatic logout executed after ${timeoutMinutes} minutes of inactivity to protect against session hijacking.`
      );
    }
    setShowWarningModal(false);
    authService.logout();
  };

  if (!currentUser || !showWarningModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border-2 border-amber-600/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
          <ShieldAlert className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Security Inactivity Warning</h3>
          <p className="text-xs text-slate-300 mt-1">
            To protect your financial statements and society ledger from unauthorized physical access, your session will automatically terminate in:
          </p>
        </div>

        <div className="py-2">
          <div className="inline-block bg-slate-950 border border-amber-600/60 px-6 py-2.5 rounded-2xl">
            <span className="font-mono text-3xl font-black text-amber-400">
              {secondsRemaining}s
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          If you are still working, click <strong>&quot;Stay Logged In&quot;</strong> to reset your secure session.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={handleExecuteAutoLogout}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-800 text-rose-300 hover:bg-rose-950 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={resetActivity}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Stay Logged In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
