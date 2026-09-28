import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, User, Key, ArrowRight, ShieldCheck, Briefcase, UserCheck } from 'lucide-react';
import { PREDEFINED_PERSONAS, PredefinedPersona, authService } from '../services/authService';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername?: string;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUsername,
}) => {
  const [customUsername, setCustomUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSelectPersona = (persona: PredefinedPersona) => {
    setErrorMsg('');
    const ok = authService.loginAsPersona(persona.username);
    if (ok) {
      setSuccessMsg(`Switched to ${persona.name} (${persona.role})`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 400);
    } else {
      setErrorMsg('Failed to switch persona.');
    }
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!customUsername) {
      setErrorMsg('Please enter a username or member ID (e.g. ssakil, sawdagor, manager1, PHSM-007).');
      return;
    }

    const res = authService.login(customUsername, customPassword || 'Sarah@14#2014');
    if (res.success) {
      setSuccessMsg(res.message);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 500);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>RBAC Role Persona Switcher</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantly toggle between System Admin, Delegated Admin, Manager, and Isolated Member accounts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Click Personas */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              One-Click Predefined Personas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PREDEFINED_PERSONAS.map((p) => {
                const isSelected = currentUsername === p.username;
                return (
                  <button
                    key={p.username}
                    onClick={() => handleSelectPersona(p)}
                    className={`text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/50 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-200">{p.label}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-medium">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-emerald-400 text-xs mb-1">{p.name}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-slate-300">ID: {p.username}</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        Switch <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Login Form */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Or Sign In with Any Member ID (PHSM-001 to PHSM-144)
            </h4>
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Username / Member ID</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      placeholder="e.g. ssakil, PHSM-007, manager1"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Password <span className="text-slate-500">(Optional for demo)</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      placeholder="Default: Sarah@14#2014"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Root System Admin: <strong className="text-slate-200">SAIF AHMED SAKIL</strong> (+8801611447765)</span>
          <button onClick={onClose} className="hover:text-white transition">Close</button>
        </div>
      </div>
    </div>
  );
};
