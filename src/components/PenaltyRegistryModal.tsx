import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  PlusCircle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowDownCircle,
  HelpCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { User, SharePenaltyRecord } from '../types';
import { storageService } from '../services/storageService';
import { formatBDT } from '../utils/calculations';

interface PenaltyRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onOpenImposeModal?: () => void;
}

export const PenaltyRegistryModal: React.FC<PenaltyRegistryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenImposeModal,
}) => {
  const [penalties, setPenalties] = useState<SharePenaltyRecord[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IMPOSED' | 'WAIVED'>('ALL');
  const [waivePenaltyId, setWaivePenaltyId] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState<string>('');
  const [feedback, setFeedback] = useState<{ success?: string; error?: string } | null>(null);

  const isAdmin =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'DELEGATED_ADMIN' ||
    currentUser?.isDelegatedAdmin;

  const isSystemAdmin = currentUser?.role === 'SYSTEM_ADMIN';

  // Load and subscribe to storage changes
  const refreshData = () => {
    setPenalties(storageService.getPenalties());
    setIsPublic(storageService.isPenaltyListPublic());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = storageService.subscribe(() => {
      refreshData();
    });
    return () => unsub();
  }, []);

  const handleToggleVisibility = () => {
    if (!isAdmin) return;
    try {
      const nextVal = !isPublic;
      storageService.setPenaltyListPublic(nextVal, currentUser);
      setIsPublic(nextVal);
      setFeedback({
        success: `Penalty Registry visibility updated: Now ${
          nextVal ? 'VISIBLE TO ALL SHARE OWNERS' : 'HIDDEN FROM GENERAL SHAREHOLDERS'
        }.`,
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ error: err.message || 'Failed to update visibility.' });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleWaiveSubmit = (penaltyId: string) => {
    if (!isAdmin) return;
    try {
      storageService.waivePenalty(penaltyId, currentUser, waiveReason.trim() || 'Waived by administrative decision');
      setFeedback({
        success: `Penalty ${penaltyId} waived successfully. Member deposit restored and system income reversed.`,
      });
      setWaivePenaltyId(null);
      setWaiveReason('');
      refreshData();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ error: err.message || 'Failed to waive penalty.' });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  // Filtered penalties
  const filteredPenalties = useMemo(() => {
    return penalties.filter((p) => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.memberName.toLowerCase().includes(q) ||
        p.memberId.toLowerCase().includes(q) ||
        String(p.shareNumber).includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        p.controllingDirectorName.toLowerCase().includes(q)
      );
    });
  }, [penalties, statusFilter, searchQuery]);

  // Aggregate stats
  const totalImposed = useMemo(() => {
    return penalties
      .filter((p) => p.status === 'IMPOSED')
      .reduce((sum, p) => sum + p.penaltyAmount, 0);
  }, [penalties]);

  const activeCount = useMemo(() => {
    return penalties.filter((p) => p.status === 'IMPOSED').length;
  }, [penalties]);

  const waivedCount = useMemo(() => {
    return penalties.filter((p) => p.status === 'WAIVED').length;
  }, [penalties]);

  const handleExportCSV = () => {
    const headers = [
      'Penalty ID',
      'Share Number',
      'Member ID',
      'Member Name',
      'Controlling Director',
      'Penalty Amount (BDT)',
      'Imposition Type',
      'Rate (%)',
      'Reason',
      'Imposed By',
      'Date Imposed',
      'Status',
      'Deducted From Deposit',
    ];

    const rows = filteredPenalties.map((p) => [
      `"${p.id}"`,
      p.shareNumber,
      `"${p.memberId}"`,
      `"${p.memberName}"`,
      `"${p.controllingDirectorName}"`,
      p.penaltyAmount,
      `"${p.impositionType}"`,
      p.percentageRate || 'N/A',
      `"${p.reason.replace(/"/g, '""')}"`,
      `"${p.imposedByName}"`,
      `"${p.imposedAt.split('T')[0]}"`,
      `"${p.status}"`,
      `"${p.isDeductedFromDeposit ? 'YES' : 'NO'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `"Prottasha Housing Society - Official Penalty Ledger & Deductions"`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PHS_Penalty_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  // If list is hidden and current user is not admin
  const isAccessRestricted = !isPublic && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-5xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>Central Penalty Registry</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">144 Shares Surcharge Ledger</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Society Penalty & Late Surcharge Registry</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Official record of late payment surcharges auto-deducted from shareholder deposits and treated as system income.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* System Admin Visibility Toggle Switch */}
            {isAdmin && (
              <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span className="text-xs text-slate-300 font-medium">Public to All Owners:</span>
                <button
                  type="button"
                  onClick={handleToggleVisibility}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isPublic
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-rose-950/80 text-rose-300 border border-rose-700'
                  }`}
                  title={
                    isPublic
                      ? 'Click to make penalty list invisible to general shareholders'
                      : 'Click to make penalty list visible to all shareholders'
                  }
                >
                  {isPublic ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visible (ON)</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hidden (OFF)</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Impose Penalty Button for Admin */}
            {isAdmin && onOpenImposeModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImposeModal();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Impose Penalty</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback?.success && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{feedback.success}</span>
          </div>
        )}
        {feedback?.error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{feedback.error}</span>
          </div>
        )}

        {/* Restricted View Screen if Admin turned off visibility */}
        {isAccessRestricted ? (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-800 flex items-center justify-center mx-auto text-rose-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-white">Penalty Registry Visibility Restricted</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                The Executive Committee & System Administration has currently set the collective penalty list to private. Shareholder individual penalties remain visible on each owner&apos;s personal financial statement.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Status: Public visibility toggled OFF by System Administration.
            </div>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Penalties Imposed</div>
                <div className="text-xl font-bold font-mono text-rose-400 mt-1">
                  {formatBDT(totalImposed)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Credited to Society Income & deducted from deposits
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Active Deductions</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {activeCount} <span className="text-xs font-normal text-slate-400">Records</span>
                </div>
                <div className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Enforced on 144 share accounts</span>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Public Registry Status</div>
                <div className="text-sm font-bold text-emerald-300 mt-1 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span>{isPublic ? 'Open to All 144 Share Owners' : 'Restricted to EC'}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Controlled by System Administrator
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Share #, name, reason..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                  {(['ALL', 'IMPOSED', 'WAIVED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                        statusFilter === st
                          ? 'bg-rose-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st === 'ALL' ? 'All' : st === 'IMPOSED' ? 'Active' : 'Waived'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  title="Export penalty list to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            {/* Table of Penalties */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Penalty ID</th>
                      <th className="py-2.5 px-3">Shareholder</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Reason / Details</th>
                      <th className="py-2.5 px-3 text-right">Penalty (BDT)</th>
                      <th className="py-2.5 px-3">Mode</th>
                      <th className="py-2.5 px-3">Status</th>
                      {isAdmin && <th className="py-2.5 px-3 text-center">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPenalties.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="py-8 text-center text-slate-500">
                          No penalty records found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPenalties.map((p) => {
                        const isWaived = p.status === 'WAIVED';
                        return (
                          <tr key={p.id} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{p.id}</td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-white">
                                {p.memberName}{' '}
                                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-1 py-0.5 rounded ml-1">
                                  Share #{p.shareNumber}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400">{p.controllingDirectorName}</div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-300">
                              {p.imposedAt.split('T')[0]}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="text-slate-200 max-w-xs truncate" title={p.reason}>
                                {p.reason}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Imposed by: {p.imposedByName}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              <span
                                className={
                                  isWaived
                                    ? 'line-through text-slate-500'
                                    : 'text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40'
                                }
                              >
                                {formatBDT(p.penaltyAmount)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                {p.impositionType === 'PERCENTAGE_DUE'
                                  ? `${p.percentageRate}% Due`
                                  : 'Fixed BDT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isWaived ? (
                                <span className="text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-1.5 py-0.5 rounded">
                                  Waived
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                                  Deducted
                                </span>
                              )}
                            </td>
                            {isAdmin && (
                              <td className="py-2.5 px-3 text-center">
                                {!isWaived && (
                                  <button
                                    type="button"
                                    onClick={() => setWaivePenaltyId(p.id)}
                                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-medium transition"
                                    title="Waive penalty and restore member deposit"
                                  >
                                    Waive
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Waive Confirmation Sub-dialog */}
            {waivePenaltyId && (
              <div className="bg-slate-950 border border-amber-700/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <RotateCcw className="w-4 h-4" />
                  <span>Waive Penalty {waivePenaltyId}</span>
                </div>
                <p className="text-xs text-slate-300">
                  Waiving this penalty will restore the shareholder&apos;s deposits and reverse the linked society income entry.
                </p>
                <div>
                  <input
                    type="text"
                    value={waiveReason}
                    onChange={(e) => setWaiveReason(e.target.value)}
                    placeholder="Enter official waiver rationale / EC resolution..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setWaivePenaltyId(null);
                      setWaiveReason('');
                    }}
                    className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWaiveSubmit(waivePenaltyId)}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                  >
                    Confirm Waiver
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
