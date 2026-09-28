import React, { useState, useMemo } from 'react';
import {
  Building2,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authService } from '../services/authService';
import { storageService } from '../services/storageService';

export const LoginScreen: React.FC = () => {
  const [selectedIdentifier, setSelectedIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch all officials and members dynamically
  const officials = useMemo(() => {
    return storageService.getOfficials();
  }, []);

  const members = useMemo(() => {
    return storageService.getMembers();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedIdentifier.trim()) {
      setErrorMsg('Please select a Username, Staff ID, or Share Number from the drop-down list.');
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
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative font-sans selection:bg-emerald-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="relative z-10 max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/80 border border-emerald-400/30">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Prottasha Housing Society
          </h1>
          <p className="text-xs text-slate-400">
            Finance & Accounts Management Portal
          </p>
        </div>

        {/* Simple Login Box */}
        <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {errorMsg && (
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
            {/* Username / Staff ID / Share Number Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Username, Staff ID, or Share Number</span>
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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner font-mono"
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
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Login to System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Clean, Simple Footer */}
        <p className="text-center text-[11px] text-slate-500">
          Prottasha Housing Society Ltd. • 144 Share Capital Structure
        </p>
      </div>
    </div>
  );
};
