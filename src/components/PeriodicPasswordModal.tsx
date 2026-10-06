import React, { useState, useMemo } from 'react';
import {
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  Users,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  FileText,
  X,
  History,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { User, PeriodicPasswordPolicy, PeriodicPasswordStatus } from '../types';
import { storageService } from '../services/storageService';

interface PeriodicPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSuccess?: (message: string) => void;
}

export const PeriodicPasswordModal: React.FC<PeriodicPasswordModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [stats, setStats] = useState(() => storageService.getUsersPasswordSecurityStats());
  const policy: PeriodicPasswordPolicy = stats.policy;
  const status: PeriodicPasswordStatus = stats.status;

  const [newPassword, setNewPassword] = useState(policy.initialPassword || '12345679');
  const [showPassword, setShowPassword] = useState(false);
  const [rotationDays, setRotationDays] = useState<number>(policy.rotationFrequencyDays || 90);
  const [scope, setScope] = useState<'ALL_USERS_EXCEPT_ROOT' | 'ALL_MEMBERS' | 'OFFICIALS_ONLY' | 'SYSTEM_DEFAULT_ONLY'>(
    'ALL_USERS_EXCEPT_ROOT'
  );
  const [forceLoginChange, setForceLoginChange] = useState(true);
  const [customRemarks, setCustomRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'CONFIGURE' | 'NOTICE' | 'HISTORY'>('CONFIGURE');

  if (!isOpen) return null;

  const refreshData = () => {
    setStats(storageService.getUsersPasswordSecurityStats());
  };

  // Preset Password Generators
  const handleApplyPreset = (preset: string) => {
    setNewPassword(preset);
  };

  const generateRandomStrongPin = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz@#$';
    let res = 'PHS@';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(res);
  };

  // Format Next Due Date for Display
  const nextDueDateFormatted = useMemo(() => {
    if (rotationDays === 0) return 'Manual / On-Demand Cycle (No Auto-Expiration)';
    const nextTime = Date.now() + rotationDays * 24 * 60 * 60 * 1000;
    return new Date(nextTime).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [rotationDays]);

  // Notice Text for Members
  const officialNoticeText = useMemo(() => {
    const periodLabel =
      rotationDays === 30
        ? 'Monthly'
        : rotationDays === 60
        ? 'Bi-Monthly'
        : rotationDays === 90
        ? 'Quarterly'
        : rotationDays === 180
        ? 'Semi-Annual'
        : rotationDays === 365
        ? 'Annual'
        : 'Official Periodic';

    return `*PROTTASHA HOUSING SOCIETY LTD.*
*OFFICIAL SECURITY CIRCULAR: PERIODIC INITIAL PASSWORD UPDATE*
Date: ${new Date().toLocaleDateString('en-GB')}

Dear Shareholders (144 Shares) & Society Officials,
As part of our ${periodLabel} digital governance and cybersecurity protocol under the Executive Committee, the System Administrator has updated the society system's Initial Baseline Password.

🔑 *New Periodic Initial Password:* ${newPassword}
🌐 *Portal URL:* https://phs-finance.web.app
👤 *Your Login Username:* Your Member ID (e.g. PHSM-002, PHSM-007, or official ID)

🔒 *Action Required:*
Upon your next login using this initial password, you will be automatically prompted to set your personal private password.

Authorized by:
*Saif Ahmed Sakil*
Root System Administrator & President
Prottasha Housing Society Ltd.`;
  }, [newPassword, rotationDays]);

  const handleCopyNotice = () => {
    navigator.clipboard.writeText(officialNoticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.trim().length < 6) {
      setErrorMessage('Initial password must be at least 6 characters long.');
      return;
    }

    const scopeDesc =
      scope === 'ALL_USERS_EXCEPT_ROOT'
        ? `all ${stats.totalUsersCount} accounts (All 144 Members and Officials, preserving Root Admin)`
        : scope === 'ALL_MEMBERS'
        ? 'all 144 shareholder accounts'
        : scope === 'OFFICIALS_ONLY'
        ? 'all official manager and staff accounts'
        : 'system default configuration only (future registrations and manual resets)';

    const confirmMsg = `CONFIRM PERIODIC INITIAL PASSWORD ROLLOUT:
• New Initial Password: "${newPassword}"
• Rotation Cycle: ${rotationDays > 0 ? `${rotationDays} Days` : 'Manual'}
• Scope: ${scopeDesc}
• Force Password Change on Next Login: ${forceLoginChange ? 'YES' : 'NO'}

Are you sure you want to execute this periodic password update for the society?`;

    if (!window.confirm(confirmMsg)) return;

    setIsSubmitting(true);
    try {
      const res = storageService.setPeriodicInitialPassword(
        {
          newInitialPassword: newPassword.trim(),
          rotationFrequencyDays: rotationDays,
          appliedScope: scope,
          forceNextLoginChange: forceLoginChange,
          remarks: customRemarks.trim() || undefined,
        },
        currentUser
      );

      refreshData();
      setIsSubmitting(false);
      if (onSuccess) {
        onSuccess(res.message);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update periodic initial password.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>System Initial Password & Periodic Rotation Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  System Admin Authority
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Periodically establish & roll out the default baseline password across all 144 shares & officials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Strip & Macro Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Current Initial Pass</div>
            <div className="text-sm font-mono font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <span>{policy.initialPassword}</span>
              <button
                type="button"
                onClick={handleCopyPassword}
                title="Copy current password"
                className="text-slate-500 hover:text-slate-300"
              >
                {copiedPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Rotation Frequency</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">
              {status.frequencyLabel}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">Next Rotation Status</div>
            <div className="flex items-center gap-1 mt-0.5">
              {status.isOverdue ? (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Overdue ({status.daysOverdue}d)</span>
                </span>
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>In {status.daysRemaining} days</span>
                </span>
              )}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] text-slate-400 font-medium">User Passwords State</div>
            <div className="text-xs font-medium text-slate-300 mt-0.5">
              <span className="text-emerald-400 font-bold">{stats.customPasswordCount}</span> Custom /{' '}
              <span className="text-amber-400 font-bold">{stats.initialDefaultPasswordCount}</span> Initial
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('CONFIGURE')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'CONFIGURE'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Configure & Roll Out</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTICE')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'NOTICE'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Member Notice / SMS Circular</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'HISTORY'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Rotation Audit History ({policy.history?.length || 0})</span>
          </button>
        </div>

        {/* TAB 1: CONFIGURE */}
        {activeTab === 'CONFIGURE' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
            {errorMessage && (
              <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-xl text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Explanatory Policy Card */}
            <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Executive Periodic Password Protocol:</span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                As Root System Administrator (<strong>{currentUser.name}</strong>), you can periodically establish the
                initial password for all shareholders (PHSM-001 to PHSM-144) and society officials. When rolled out, users
                are granted immediate access with this initial password and are strictly prompted on next login to define
                their unique confidential password.
              </p>
            </div>

            {/* Password Input & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>New Initial Password</span>
                  <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('12345679')}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] border border-slate-700"
                  >
                    12345679
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('Prottasha@2026')}
                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[10px] border border-slate-700"
                  >
                    Prottasha@2026
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomStrongPin}
                    className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900/80 text-amber-300 rounded text-[10px] border border-amber-800 flex items-center gap-1"
                  >
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Generate Strong</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-20 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-500 transition"
                  placeholder="Enter initial password (min 6 chars)"
                />
                <div className="absolute right-2.5 top-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Minimum 6 characters. Members will use this initial password on their first login or after rotation.
              </p>
            </div>

            {/* Periodic Rotation Frequency & Target Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Periodic Rotation Interval</span>
                </label>
                <select
                  value={rotationDays}
                  onChange={(e) => setRotationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-amber-500"
                >
                  <option value={30}>Every 30 Days (Monthly Rotation)</option>
                  <option value={60}>Every 60 Days (Bi-Monthly Rotation)</option>
                  <option value={90}>Every 90 Days (Quarterly Rotation - Standard)</option>
                  <option value={180}>Every 180 Days (Semi-Annual Rotation)</option>
                  <option value={365}>Every 365 Days (Annual Rotation)</option>
                  <option value={0}>Manual On-Demand (No Periodic Timer)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  Next scheduled due date: <strong className="text-amber-300">{nextDueDateFormatted}</strong>
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Target Rollout Scope</span>
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-amber-500"
                >
                  <option value="ALL_USERS_EXCEPT_ROOT">
                    All 144 Members & Officials (Root Admin Excluded)
                  </option>
                  <option value="ALL_MEMBERS">All 144 Shareholder Members Only</option>
                  <option value="OFFICIALS_ONLY">Society Officials & Staff Only</option>
                  <option value="SYSTEM_DEFAULT_ONLY">Update System Default Only (No Active User Reset)</option>
                </select>
                <span className="text-[10px] text-slate-400">
                  {scope === 'ALL_USERS_EXCEPT_ROOT'
                    ? 'Resets password for all 144 members & officials. Saif Ahmed Sakil is protected.'
                    : 'Restricted to the selected group.'}
                </span>
              </div>
            </div>

            {/* Checkbox: Force Password Change on Next Login */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
              <input
                type="checkbox"
                id="forceNextLoginChange"
                checked={forceLoginChange}
                onChange={(e) => setForceLoginChange(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="forceNextLoginChange" className="cursor-pointer text-slate-300 space-y-0.5">
                <span className="font-semibold text-white block">
                  Force password update upon next user login (Mandatory First-Time Setup)
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Recommended for maximum security. When checked, users logging in with the initial password cannot
                  proceed until they choose a private confidential password.
                </span>
              </label>
            </div>

            {/* Remarks / Executive Note */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold">Administrative Audit Note / Remarks (Optional)</label>
              <input
                type="text"
                value={customRemarks}
                onChange={(e) => setCustomRemarks(e.target.value)}
                placeholder="e.g. Q2 2026 scheduled quarterly security password rotation"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-amber-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audited action logged with Root Admin signature</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 sm:w-auto px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Set Initial Password & Roll Out</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: NOTICE / CIRCULAR */}
        {activeTab === 'NOTICE' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Official Member Circular & SMS Format</h4>
                <p className="text-slate-400 text-[11px]">
                  Copy and distribute via SMS, WhatsApp broadcast, or General Assembly Notice Board
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyNotice}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow transition"
              >
                {copiedNotice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNotice ? 'Copied to Clipboard!' : 'Copy Circular'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {officialNoticeText}
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Note: When members receive this circular, they can log in immediately using their Member ID (e.g.{' '}
                <strong className="text-white">PHSM-002</strong>) and the initial password{' '}
                <strong className="text-amber-300 font-mono">{newPassword}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: ROTATION HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-white text-sm">Periodic Password Rotation Audit Trail</h4>
                <p className="text-slate-400 text-[11px]">
                  Chronological records of all periodic password updates enacted by System Administration
                </p>
              </div>
              <div className="text-slate-400 text-[11px]">
                Total Records: <strong className="text-white">{policy.history?.length || 0}</strong>
              </div>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {(!policy.history || policy.history.length === 0) && (
                <div className="text-center py-8 text-slate-500">No previous password rotation logs recorded yet.</div>
              )}

              {policy.history?.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.setByName}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{new Date(item.timestamp).toLocaleString('en-GB')}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-semibold border border-amber-800/60 text-[10px] self-start sm:self-auto">
                      Cycle: {item.rotationFrequencyDays > 0 ? `${item.rotationFrequencyDays} Days` : 'Manual'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="text-slate-400">
                      Scope: <strong className="text-slate-200">{item.appliedScope}</strong>
                    </div>
                    <div className="text-slate-400">
                      Affected Accounts: <strong className="text-emerald-400">{item.affectedUsersCount}</strong>
                    </div>
                    <div className="text-slate-400">
                      Initial Pass: <span className="font-mono text-amber-300">{item.initialPasswordPreview}</span>
                    </div>
                    <div className="text-slate-400">
                      Status: <strong className="text-slate-300">{item.status}</strong>
                    </div>
                  </div>

                  {item.remarks && (
                    <div className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                      "{item.remarks}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
