import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Clock,
  KeyRound,
  FileCheck,
  Globe,
} from 'lucide-react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';
import { securityEngine } from '../utils/security';

export const LoginScreen: React.FC = () => {
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lockoutCountdown, setLockoutCountdown] = useState<number>(0);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  // Fetch all officials and members dynamically
  const officials = useMemo(() => {
    return storageService.getOfficials();
  }, []);

  const members = useMemo(() => {
    return storageService.getMembers();
  }, []);

  const verifiedPortal = useMemo(() => {
    return securityEngine.getVerifiedPortalInfo();
  }, []);

  // Update lockout countdown timer
  useEffect(() => {
    if (!selectedIdentifier) {
      setLockoutCountdown(0);
      return;
    }
    const status = securityEngine.getLockoutStatus(selectedIdentifier);
    if (status.isLocked) {
      setLockoutCountdown(status.remainingSeconds);
    } else {
      setLockoutCountdown(0);
    }
  }, [selectedIdentifier, errorMsg]);

  useEffect(() => {
    if (lockoutCountdown <= 0) return;
    const timer = setInterval(() => {
      setLockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutCountdown]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedIdentifier.trim()) {
      setErrorMsg('Please select a Username, Staff ID, or Share Number from the list.');
      return;
    }

    if (lockoutCountdown > 0) {
      setErrorMsg(`Brute-force shield active: Please wait ${lockoutCountdown} seconds before submitting again.`);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    const res = authService.login(selectedIdentifier, password);
    if (res.success) {
      setSuccessMsg(res.message);
    } else {
      setErrorMsg(res.message);
      const status = securityEngine.getLockoutStatus(selectedIdentifier);
      if (status.isLocked) {
        setLockoutCountdown(status.remainingSeconds);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 relative font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="relative z-10 max-w-lg w-full mx-auto space-y-5">
        {/* Anti-Phishing Official Society Header Badge */}
        <div className="flex items-center justify-center gap-2 text-xs">
          <div className="bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Verified Official Society Financial Gateway</span>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/80 border border-emerald-400/30">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Prottasha Housing Society
          </h1>
          <p className="text-xs text-slate-400">
            Official Finance & Accounts Command Portal • 144 Shares Capital Registry
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Brute-Force Lockout Alert Banner */}
          {lockoutCountdown > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700 text-rose-200 text-xs space-y-1.5 animate-pulse">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>BRUTE-FORCE PROTECTION ENGAGED</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                5 consecutive incorrect attempts detected. Temporary security lock active. Please wait{' '}
                <strong className="text-white font-mono text-sm underline">{lockoutCountdown}s</strong> before retry.
              </p>
            </div>
          )}

          {errorMsg && lockoutCountdown === 0 && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select Username, Staff ID, or Share Number</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">144 Accounts</span>
              </label>
              <select
                required
                value={selectedIdentifier}
                onChange={(e) => {
                  setSelectedIdentifier(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner"
              >
                <option value="">-- Choose Account to Sign In --</option>

                {/* Executive Committee & Leadership */}
                <optgroup label="Executive Committee & System Admins">
                  <option value="ssakil">
                    Saif Ahmed Sakil (System Admin / President — Share #01)
                  </option>
                  <option value="molla">
                    M Omar Faruque Molla (VICE PRESIDENT (VP) — Share #49)
                  </option>
                  <option value="sawdagor">
                    M Masud Sawdagor (General Secretary — Share #21)
                  </option>
                  <option value="sirajul">
                    Sirajul Islam (TREASURER — Share #88)
                  </option>
                  <option value="shahin">
                    Shahin Ahmed (MEMBER in EC — Share #56)
                  </option>
                  <option value="hashim">
                    Abul Hashim (MEMBER in EC — Share #71)
                  </option>
                  <option value="yousuf">
                    M Abu Yousuf (MEMBER in EC — Share #95)
                  </option>
                  <option value="faizan">
                    Faizan Ahmed (MEMBER in EC — Share #102)
                  </option>
                </optgroup>

                {/* Society Officials & Staff */}
                <optgroup label="Official Users & Society Staff">
                  {officials.map((o) => (
                    <option key={o.id} value={o.username}>
                      {o.name} ({o.designation} — Staff ID: {o.id} / @{o.username})
                    </option>
                  ))}
                </optgroup>

                {/* Shareholder Members (1-144) */}
                <optgroup label="Shareholder Members (Shares 1 to 144)">
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id}: {m.name} (Share #{m.shareNumber})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Password</span>
                </label>
                <span className="text-[10px] text-slate-400">Encrypted AES-256</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  disabled={lockoutCountdown > 0}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={lockoutCountdown > 0 ? 'Account locked...' : 'Enter your password'}
                  className="w-full px-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner font-mono disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={lockoutCountdown > 0}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{lockoutCountdown > 0 ? `Locked (${lockoutCountdown}s)` : 'Login to System'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Anti-Phishing Security Advisory & Verification Trust Seal */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Anti-Phishing Trust Seal</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                className="text-teal-400 hover:underline text-[10px]"
              >
                {showSecurityDetails ? 'Hide Trust Info' : 'Verify Portal Cert'}
              </button>
            </div>

            {showSecurityDetails && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono animate-in fade-in">
                <div className="flex justify-between">
                  <span className="text-slate-500">Authority:</span>
                  <span className="text-white">{verifiedPortal.organizationName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Standard:</span>
                  <span className="text-emerald-400">TLS 1.3 / AES-256 Bit</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Code:</span>
                  <span className="text-teal-300">{verifiedPortal.antiPhishingSecurityCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Origin Domain:</span>
                  <span className="text-white">{verifiedPortal.portalDomain}</span>
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Anti-Phishing Notice:</strong> Always confirm the address bar begins with the authorized Prottasha domain. Society officials will <em>never</em> request your account password via phone, SMS, WhatsApp, or email.
              </span>
            </div>
          </div>
        </div>

        {/* Clean, Simple Footer */}
        <p className="text-center text-[11px] text-slate-500">
          Prottasha Housing Society Ltd. • 144 Share Capital Structure • Security Shield Active
        </p>
      </div>
    </div>
  );
};
