import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut,
  Building2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { User } from '../types';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

interface ForcePasswordChangeModalProps {
  currentUser: User;
  onSuccess?: () => void;
}

export const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({
  currentUser,
  onSuccess,
}) => {
  const systemDefault = storageService.getSystemDefaultPassword();
  const [currentPassword, setCurrentPassword] = useState(systemDefault);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Strength Evaluation
  const strength = useMemo(() => {
    if (!newPassword) return { score: 0, label: 'None', color: 'bg-slate-700', text: 'text-slate-500' };
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score += 1;
    if (/\d/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;

    if (newPassword === systemDefault || newPassword === '12345679') {
      return { score: 0, label: 'Default (Not Allowed)', color: 'bg-rose-500', text: 'text-rose-400' };
    }
    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [newPassword, systemDefault]);

  // Validation Rules
  const isMinLength = newPassword.length >= 6;
  const isNotDefault = newPassword.trim() !== systemDefault && newPassword.trim() !== '12345679';
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isMinLength && isNotDefault && isMatching && !isSubmitting;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isMinLength) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (!isNotDefault) {
      setErrorMsg(`You cannot reuse the default password (${systemDefault}). Please choose a new secure personal password.`);
      return;
    }

    if (!isMatching) {
      setErrorMsg('Confirmation password does not match the new password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = authService.completePasswordChange(newPassword.trim());
      if (res.success) {
        setSuccessMsg('Password successfully updated! Redirecting to your dashboard...');
        setTimeout(() => {
          setIsSubmitting(false);
          if (onSuccess) {
            onSuccess();
          }
        }, 1200);
      } else {
        setErrorMsg(res.message);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/60 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-lg shadow-emerald-950/40">
            <ShieldAlert className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>

          <div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/60 mb-1.5">
              First-Time Login Security Requirement
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Change Your Default Password
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              For central registry security and data protection, all shareholders and officials must set a personal password upon first login.
            </p>
          </div>

          {/* User Profile Badge */}
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{currentUser.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono text-[11px]">
              {currentUser.memberId || currentUser.username}
            </span>
            <span className="text-slate-600">•</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Current / Default Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Current Initial Password</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Initial: 12345679
              </span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Initial default: 12345679"
                className="w-full px-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                title={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Personal Password</span>
              </span>
              {newPassword && (
                <span className={`text-[10px] font-semibold ${strength.text}`}>
                  Strength: {strength.label}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Enter at least 6 characters"
                className="w-full px-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                title={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {newPassword && (
              <div className="mt-1.5 flex gap-1 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score >= 1 ? strength.color : 'bg-transparent'
                  }`}
                  style={{ width: '33.3%' }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score >= 2 ? strength.color : 'bg-transparent'
                  }`}
                  style={{ width: '33.3%' }}
                />
                <div
                  className={`h-full transition-all duration-300 ${
                    strength.score >= 3 ? strength.color : 'bg-transparent'
                  }`}
                  style={{ width: '33.4%' }}
                />
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Confirm New Password</span>
              </span>
              {confirmPassword && (
                <span
                  className={`text-[10px] font-semibold ${
                    isMatching ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {isMatching ? '✓ Passwords Match' : '✗ Do not match'}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="Re-type new password"
                className="w-full px-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Security Rules Checklist */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1">
            <div className="font-semibold text-slate-300 mb-1">Password Requirements:</div>
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isMinLength ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isMinLength ? '✓' : '•'}
              </span>
              <span className={isMinLength ? 'text-slate-200' : 'text-slate-400'}>
                Minimum 6 characters long
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isNotDefault ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isNotDefault ? '✓' : '•'}
              </span>
              <span className={isNotDefault ? 'text-slate-200' : 'text-slate-400'}>
                Cannot be default initial password (<span className="font-mono">12345679</span>)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isMatching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isMatching ? '✓' : '•'}
              </span>
              <span className={isMatching ? 'text-slate-200' : 'text-slate-400'}>
                Both password fields match identically
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                canSubmit
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/60 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Securing Account...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Set Password & Enter System</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              title="Sign out without saving"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
