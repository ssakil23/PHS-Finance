import React, { useState, useMemo } from 'react';
import {
  PieChart,
  Users,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building,
  CheckCircle,
  AlertCircle,
  Download,
  Phone,
  Mail,
  ChevronRight,
  ArrowLeftRight,
  FileCheck,
  Printer,
  Search,
  Filter,
  X,
  Share2,
  Calendar,
  Layers,
  Scale,
  Receipt,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BadgePercent,
} from 'lucide-react';
import {
  IncomeEntry,
  ExpenseEntry,
  Member,
  User,
  ShareTransferRecord,
  ShareTransferCategory,
  PaymentMethod,
} from '../types';
import {
  computeDirectorSummaries,
  computeProjectFinancials,
  formatBDT,
  DirectorFinancialSummary,
} from '../utils/calculations';
import {
  DIRECTORS,
  TOTAL_SHARES,
  formatMemberId,
  getDirectorForShareNumber,
} from '../utils/directors';
import { storageService } from '../services/storageService';

interface DirectorSummaryViewProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  currentUser?: User | null;
  onSelectMemberStatement?: (memberId: string) => void;
}

export const DirectorSummaryView: React.FC<DirectorSummaryViewProps> = ({
  incomes,
  expenses,
  members,
  currentUser,
  onSelectMemberStatement,
}) => {
  const summaries = computeDirectorSummaries(incomes, expenses);
  const financials = computeProjectFinancials(incomes, expenses);

  // Sub-tabs: 'MATRIX' for Director Portfolios, 'TRANSFERS' for Share Transfer Register
  const [activeTab, setActiveTab] = useState<'MATRIX' | 'TRANSFERS'>('MATRIX');
  const [selectedDirectorKey, setSelectedDirectorKey] = useState<string>(
    summaries[0]?.director.key || 'SAIF_AHMED_SAKIL'
  );

  // Share Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferFromMemberId, setTransferFromMemberId] = useState<string>('');
  const [transferToMemberId, setTransferToMemberId] = useState<string>('');
  const [transferShareNumber, setTransferShareNumber] = useState<number>(1);
  const [transferAmount, setTransferAmount] = useState<number | string>(100000);
  const [transferFeeBDT, setTransferFeeBDT] = useState<number | string>(5000);
  const [transferFeePayer, setTransferFeePayer] = useState<'TRANSFEREE' | 'TRANSFEROR' | 'EXEMPT'>('TRANSFEREE');
  const [transferCategory, setTransferCategory] = useState<ShareTransferCategory>('FULL_OWNERSHIP_TRANSFER');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [bankReferenceNumber, setBankReferenceNumber] = useState<string>('');
  const [resolutionNumber, setResolutionNumber] = useState<string>(
    `EC-RES-2026-${String(Math.floor(10 + Math.random() * 89))}`
  );
  const [deedOrStampNumber, setDeedOrStampNumber] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('Mutual agreement and conveyance of share entitlement');
  const [transferRemarks, setTransferRemarks] = useState<string>('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState<boolean>(false);
  const [transferFeedback, setTransferFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
    transferRecord?: ShareTransferRecord;
  } | null>(null);

  // Share Transfer Certificate Modal
  const [selectedCertificateTransfer, setSelectedCertificateTransfer] = useState<ShareTransferRecord | null>(null);

  // Registry Search & Filters
  const [registrySearch, setRegistrySearch] = useState<string>('');
  const [registryDirectorFilter, setRegistryDirectorFilter] = useState<string>('ALL');
  const [registryCategoryFilter, setRegistryCategoryFilter] = useState<string>('ALL');

  // Load Share Transfers from storageService
  const shareTransfers = useMemo(() => {
    return storageService.getShareTransfers();
  }, [incomes, transferFeedback]);

  const selectedSummary =
    summaries.find((s) => s.director.key === selectedDirectorKey) || summaries[0];

  // Get members under this director
  const directorMembers = useMemo(() => {
    return members.filter(
      (m) =>
        m.shareNumber >= selectedSummary.director.startShare &&
        m.shareNumber <= selectedSummary.director.endShare
    );
  }, [members, selectedSummary]);

  // Calculate each member's personal collection within this director's pool
  const memberCollections = useMemo(() => {
    return directorMembers.map((m) => {
      const memberDeposits = incomes
        .filter(
          (inc) =>
            inc.status === 'APPROVED' &&
            !inc.isSoftDeleted &&
            inc.type === 'GENERAL_DEPOSIT' &&
            (inc.shareOwnerId === m.id || inc.shareNumber === m.shareNumber)
        )
        .reduce((sum, inc) => sum + inc.amount, 0);

      const shareExpense = financials.perShareExpense;
      const balance = memberDeposits - shareExpense;

      return {
        member: m,
        deposits: memberDeposits,
        shareExpense,
        balance,
      };
    });
  }, [directorMembers, incomes, financials.perShareExpense]);

  // Helper to compute deposits for any given member
  const getMemberDeposits = (member: Member): number => {
    return incomes
      .filter(
        (inc) =>
          inc.status === 'APPROVED' &&
          !inc.isSoftDeleted &&
          inc.type === 'GENERAL_DEPOSIT' &&
          (inc.shareOwnerId === member.id || inc.shareNumber === member.shareNumber)
      )
      .reduce((sum, inc) => sum + inc.amount, 0);
  };

  // Currently selected transferor & transferee member objects in the modal
  const selectedFromMember = useMemo(() => {
    return members.find((m) => m.id === transferFromMemberId) || null;
  }, [members, transferFromMemberId]);

  const selectedToMember = useMemo(() => {
    return members.find((m) => m.id === transferToMemberId) || null;
  }, [members, transferToMemberId]);

  // Modal open handler
  const handleOpenTransferModal = (preselectedFromMember?: Member) => {
    const fromM = preselectedFromMember || directorMembers[0] || members[0];
    const toM = members.find((m) => m.id !== fromM.id) || members[1];

    setTransferFromMemberId(fromM.id);
    setTransferToMemberId(toM.id);
    setTransferShareNumber(fromM.shareNumber);

    const fromDeposits = getMemberDeposits(fromM);
    setTransferAmount(Math.max(0, fromDeposits));
    setTransferFeeBDT(5000);
    setTransferFeePayer('TRANSFEREE');
    setTransferCategory('FULL_OWNERSHIP_TRANSFER');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Bank Transfer');
    setBankReferenceNumber('');
    setResolutionNumber(`EC-RES-2026-${String(Math.floor(10 + Math.random() * 89))}`);
    setDeedOrStampNumber(`DEED-${fromM.shareNumber}-${Date.now().toString().slice(-4)}/2026`);
    setTransferReason('Mutual conveyance of society share entitlement and plot quota');
    setTransferRemarks('');
    setTransferFeedback(null);
    setShowTransferModal(true);
  };

  // Execute Share Transfer
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferFeedback(null);

    if (!selectedFromMember || !selectedToMember) {
      setTransferFeedback({
        type: 'error',
        message: 'Please select both a valid Transferor and Transferee member.',
      });
      return;
    }

    if (selectedFromMember.id === selectedToMember.id) {
      setTransferFeedback({
        type: 'error',
        message: 'Transferor and Transferee must be different accounts.',
      });
      return;
    }

    const numericAmount = Number(transferAmount);
    if (isNaN(numericAmount) || numericAmount < 0) {
      setTransferFeedback({
        type: 'error',
        message: 'Please enter a valid non-negative capital transfer amount.',
      });
      return;
    }

    const numericFee = Number(transferFeeBDT);
    if (isNaN(numericFee) || numericFee < 0) {
      setTransferFeedback({
        type: 'error',
        message: 'Please enter a valid non-negative transfer fee amount.',
      });
      return;
    }

    if (!resolutionNumber.trim()) {
      setTransferFeedback({
        type: 'error',
        message: 'Executive Committee / Board Resolution reference is required for audit compliance.',
      });
      return;
    }

    setIsSubmittingTransfer(true);

    try {
      // Current user or root fallback
      const effectiveUser: User = currentUser || {
        id: 'usr-admin',
        username: 'ssakil',
        name: 'Saif Ahmed Sakil',
        role: 'SYSTEM_ADMIN',
      };

      const result = storageService.recordShareTransfer(
        {
          fromMemberId: selectedFromMember.id,
          toMemberId: selectedToMember.id,
          transferredShareNumber: Number(transferShareNumber),
          transferredAmount: numericAmount,
          transferFeeBDT: numericFee,
          transferFeePayer,
          transferCategory,
          transferDate,
          paymentMethod,
          bankReferenceNumber: bankReferenceNumber.trim() || undefined,
          resolutionNumber: resolutionNumber.trim(),
          deedOrStampNumber: deedOrStampNumber.trim() || undefined,
          transferReason: transferReason.trim(),
          remarks: transferRemarks.trim() || undefined,
        },
        effectiveUser
      );

      setTransferFeedback({
        type: 'success',
        message: `Share Transfer #${result.transfer.id} successfully recorded! Both members' share ledgers and transaction histories have been updated.`,
        transferRecord: result.transfer,
      });

      // Clear modal and show certificate
      setShowTransferModal(false);
      setSelectedCertificateTransfer(result.transfer);
    } catch (err: any) {
      setTransferFeedback({
        type: 'error',
        message: err.message || 'Failed to record share transfer.',
      });
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Filtered Share Transfer Registry rows
  const filteredTransfers = useMemo(() => {
    return shareTransfers.filter((t) => {
      if (registryDirectorFilter !== 'ALL') {
        if (t.fromDirectorKey !== registryDirectorFilter && t.toDirectorKey !== registryDirectorFilter) {
          return false;
        }
      }
      if (registryCategoryFilter !== 'ALL' && t.transferCategory !== registryCategoryFilter) {
        return false;
      }
      if (registrySearch.trim()) {
        const q = registrySearch.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchFrom = t.fromMemberName.toLowerCase().includes(q) || t.fromMemberId.toLowerCase().includes(q);
        const matchTo = t.toMemberName.toLowerCase().includes(q) || t.toMemberId.toLowerCase().includes(q);
        const matchShare = t.transferredShareNumber.toString().includes(q);
        const matchRes = t.resolutionNumber.toLowerCase().includes(q);
        if (!matchId && !matchFrom && !matchTo && !matchShare && !matchRes) return false;
      }
      return true;
    });
  }, [shareTransfers, registryDirectorFilter, registryCategoryFilter, registrySearch]);

  // Export Director Matrix CSV
  const handleExportDirectorCSV = () => {
    const headers = [
      'Director Name',
      'Share Range',
      'Controlled Shares',
      'Share %',
      'Director Quota Expense (BDT)',
      'Total Collections (BDT)',
      'Current Balance (BDT)',
      'Status',
    ];

    const rows = summaries.map((s) => [
      `"${s.director.name}"`,
      `"${s.director.startShare} - ${s.director.endShare}"`,
      s.controlledShares,
      `${s.sharePercentage.toFixed(2)}%`,
      s.totalExpense,
      s.totalCollection,
      s.currentBalance,
      s.status,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Director_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Share Transfers Register CSV
  const handleExportTransfersCSV = () => {
    const headers = [
      'Transfer ID',
      'Date',
      'Share Number',
      'Category',
      'From Member ID',
      'From Member Name',
      'From Director',
      'To Member ID',
      'To Member Name',
      'To Director',
      'Transferred Amount (BDT)',
      'Transfer Fee (BDT)',
      'Fee Payer',
      'Payment Method',
      'Resolution Ref',
      'Deed / Stamp Ref',
      'Recorded By',
      'Status',
    ];

    const rows = shareTransfers.map((t) => [
      `"${t.id}"`,
      `"${t.transferDate}"`,
      t.transferredShareNumber,
      `"${t.transferCategory}"`,
      `"${t.fromMemberId}"`,
      `"${t.fromMemberName}"`,
      `"${t.fromDirectorName}"`,
      `"${t.toMemberId}"`,
      `"${t.toMemberName}"`,
      `"${t.toDirectorName}"`,
      t.transferredAmount,
      t.transferFeeBDT,
      `"${t.transferFeePayer}"`,
      `"${t.paymentMethod}"`,
      `"${t.resolutionNumber}"`,
      `"${t.deedOrStampNumber || 'N/A'}"`,
      `"${t.recordedByName}"`,
      `"${t.status}"`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PHS_Share_Transfers_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Notification Banner if transfer succeeded */}
      {transferFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs transition ${
            transferFeedback.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-rose-950/80 border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {transferFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold">{transferFeedback.message}</p>
              {transferFeedback.transferRecord && (
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  Transfer Ref: {transferFeedback.transferRecord.id} • Both member ledgers updated.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {transferFeedback.transferRecord && (
              <button
                onClick={() => setSelectedCertificateTransfer(transferFeedback.transferRecord!)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>View Certificate</span>
              </button>
            )}
            <button
              onClick={() => setTransferFeedback(null)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Official Directorate Governance
            </span>
            <span className="text-xs text-slate-400 font-mono">
              144 Shares Capital Architecture
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            <span>Director Allocation, Balance Matrix & Share Transfers</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Individual audit quotas across 8 designated directors, 4th Unit reserve, and official share transfer register.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Record Share Transfer Primary Action */}
          <button
            onClick={() => handleOpenTransferModal()}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition border border-emerald-500"
            title="Record official transfer of shares between members"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Record Share Transfer</span>
          </button>

          {activeTab === 'MATRIX' ? (
            <button
              onClick={handleExportDirectorCSV}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Matrix CSV</span>
            </button>
          ) : (
            <button
              onClick={handleExportTransfersCSV}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Transfer Register CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('MATRIX')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'MATRIX'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Director Matrix & Quota Portfolios</span>
        </button>

        <button
          onClick={() => setActiveTab('TRANSFERS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
            activeTab === 'TRANSFERS'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Share Transfer Registry & History</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
            {shareTransfers.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DIRECTOR SHARE ALLOCATION & BALANCE MATRIX                        */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          {/* Director Selection Grid / Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {summaries.map((s) => {
              const isSelected = s.director.key === selectedDirectorKey;
              const isSurplus = s.currentBalance >= 0;

              return (
                <button
                  key={s.director.key}
                  onClick={() => setSelectedDirectorKey(s.director.key)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                      : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>
                        Shares {s.director.startShare}–{s.director.endShare}
                      </span>
                      <span className="font-bold text-slate-200">{s.controlledShares} sh.</span>
                    </div>
                    <div className="font-bold text-xs text-white line-clamp-1">
                      {s.director.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Balance:</span>
                    <span className={`font-mono font-bold ${isSurplus ? 'text-teal-400' : 'text-rose-400'}`}>
                      {formatBDT(s.currentBalance)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Director Detailed Card */}
          {selectedSummary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Director Portfolio
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Shares: {selectedSummary.director.startShare} to {selectedSummary.director.endShare} ({selectedSummary.controlledShares} Shares Total)
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">{selectedSummary.director.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    {selectedSummary.director.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{selectedSummary.director.phone}</span>
                      </span>
                    )}
                    {selectedSummary.director.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{selectedSummary.director.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Status Tag & Portfolio Transfer Action */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Share Ratio</div>
                    <div className="text-lg font-bold text-white font-mono">
                      {selectedSummary.sharePercentage.toFixed(2)}% of 144
                    </div>
                    <span
                      className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        selectedSummary.status === 'SURPLUS'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : selectedSummary.status === 'BALANCED'
                          ? 'bg-slate-800 text-slate-300 border-slate-700'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {selectedSummary.status === 'SURPLUS'
                        ? 'Net Surplus Advance'
                        : selectedSummary.status === 'BALANCED'
                        ? 'Balanced Zero'
                        : 'Outstanding Share Dues'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Three Main Financial Metrics for Director */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">Director Total Expense Obligation</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {formatBDT(selectedSummary.totalExpense)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Formula: ({formatBDT(financials.totalProjectExpense)} × {selectedSummary.controlledShares}) / 144
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">
                    Total Collections from Controlled Shares
                  </div>
                  <div className="text-xl font-bold text-emerald-400 font-mono">
                    {formatBDT(selectedSummary.totalCollection)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Sum of approved deposits across {selectedSummary.controlledShares} registered shares
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-xs text-slate-400 mb-1">
                    Current Net Balance (Collection − Expense)
                  </div>
                  <div
                    className={`text-xl font-bold font-mono ${
                      selectedSummary.currentBalance >= 0 ? 'text-teal-400' : 'text-rose-400'
                    }`}
                  >
                    {formatBDT(selectedSummary.currentBalance)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {selectedSummary.currentBalance >= 0
                      ? 'Surplus advance available in society capital'
                      : 'Total pending dues payable to society escrow'}
                  </div>
                </div>
              </div>

              {/* Member Roster under this Director with Direct Transfer Capability */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Associated Share Owners ({directorMembers.length} Members)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Click Transfer to record share conveyance, or Statement to inspect personal ledger
                  </span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                      <tr>
                        <th className="py-2.5 px-4">Member ID</th>
                        <th className="py-2.5 px-4">Share #</th>
                        <th className="py-2.5 px-4">Member Name</th>
                        <th className="py-2.5 px-4">Contact Phone</th>
                        <th className="py-2.5 px-4 text-right">Personal Deposits</th>
                        <th className="py-2.5 px-4 text-right">Share Expense (1/144)</th>
                        <th className="py-2.5 px-4 text-right">Net Balance</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                      {memberCollections.map((item) => {
                        const isDue = item.balance < 0;

                        return (
                          <tr key={item.member.id} className="hover:bg-slate-800/60 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-200">
                              {item.member.id}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              #{item.member.shareNumber}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-200">
                              <div className="flex items-center gap-2">
                                <span>{item.member.name}</span>
                                {item.member.additionalShares && item.member.additionalShares.length > 0 && (
                                  <span
                                    title={`Acquired additional shares: ${item.member.additionalShares.join(', ')}`}
                                    className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold"
                                  >
                                    +{item.member.additionalShares.length} sh
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-slate-400">
                              {item.member.phone}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                              {formatBDT(item.deposits)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-slate-300">
                              {formatBDT(item.shareExpense)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              <span className={isDue ? 'text-rose-400' : 'text-teal-400'}>
                                {formatBDT(item.balance)}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  !isDue
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {isDue ? 'Dues' : 'Advance'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Record Share Transfer Action for this specific member */}
                                <button
                                  onClick={() => handleOpenTransferModal(item.member)}
                                  className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 transition"
                                  title="Initiate official share transfer from this member"
                                >
                                  <ArrowLeftRight className="w-3 h-3" />
                                  <span>Transfer</span>
                                </button>

                                <button
                                  onClick={() =>
                                    onSelectMemberStatement && onSelectMemberStatement(item.member.id)
                                  }
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold"
                                >
                                  <span>Statement</span>
                                  <ChevronRight className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SHARE TRANSFER REGISTRY & TRANSACTION HISTORY                     */}
      {/* ========================================================================= */}
      {activeTab === 'TRANSFERS' && (
        <div className="space-y-6">
          {/* Registry Header & Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Total Share Conveyance Records</div>
              <div className="text-2xl font-bold text-white font-mono">
                {shareTransfers.length} Transfers
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Formal transfers documented with Board Resolutions
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Transferred Capital Value</div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                {formatBDT(shareTransfers.reduce((sum, t) => sum + (t.transferredAmount || 0), 0))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Reallocated across shareholder deposit ledgers
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Society Transfer Fees Realized</div>
              <div className="text-2xl font-bold text-teal-400 font-mono">
                {formatBDT(shareTransfers.reduce((sum, t) => sum + (t.transferFeeBDT || 0), 0))}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Credited to Prottasha Housing Society operational fund
              </div>
            </div>
          </div>

          {/* Registry Filter & Search Toolbar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={registrySearch}
                  onChange={(e) => setRegistrySearch(e.target.value)}
                  placeholder="Search by Transfer ID, Member Name, Share #..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <select
                value={registryDirectorFilter}
                onChange={(e) => setRegistryDirectorFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Directorate Portfolios</option>
                {DIRECTORS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.name} ({d.shareCount} sh)
                  </option>
                ))}
              </select>

              <select
                value={registryCategoryFilter}
                onChange={(e) => setRegistryCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Transfer Categories</option>
                <option value="FULL_OWNERSHIP_TRANSFER">Full Ownership Transfer</option>
                <option value="CAPITAL_BALANCE_TRANSFER">Capital Balance Transfer</option>
                <option value="SECONDARY_MARKET_SALE">Secondary Market Sale</option>
                <option value="FAMILY_NOMINEE_INHERITANCE">Family Nominee / Inheritance</option>
                <option value="DIRECTOR_QUOTA_REALLOCATION">Director Quota Reallocation</option>
              </select>
            </div>

            <button
              onClick={() => handleOpenTransferModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition shrink-0"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Record New Transfer</span>
            </button>
          </div>

          {/* Transfers Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Transfer ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Share #</th>
                  <th className="py-3 px-4">Transferor (From)</th>
                  <th className="py-3 px-4">Transferee (To)</th>
                  <th className="py-3 px-4 text-right">Transferred Capital</th>
                  <th className="py-3 px-4 text-right">Society Fee</th>
                  <th className="py-3 px-4">Resolution Ref</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-500">
                      No share transfers found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {t.transferDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                        Share #{t.transferredShareNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-200">{t.fromMemberName}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{t.fromMemberId}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 truncate max-w-[120px]">{t.fromDirectorName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-emerald-300">{t.toMemberName}</div>
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                          <span>{t.toMemberId}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-500 truncate max-w-[120px]">{t.toDirectorName}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                        {formatBDT(t.transferredAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300 whitespace-nowrap">
                        {formatBDT(t.transferFeeBDT)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                        {t.resolutionNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {t.recordedByName}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedCertificateTransfer(t)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition shadow-sm"
                          title="View and print official Share Transfer Certificate"
                        >
                          <Printer className="w-3 h-3 text-emerald-400" />
                          <span>Slip</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD OFFICIAL SHARE TRANSFER (FORM ST-01)                      */}
      {/* ========================================================================= */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                    PHS Form ST-01
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Board Resolution Required
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
                  <span>Official Share Transfer & Ledger Conveyance</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Execute official transfer of share ownership or capital deposit balance. Both members' share ledgers and transaction history will be updated automatically.
                </p>
              </div>

              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Official Authority Strip */}
            <div className="bg-emerald-950/40 border-b border-emerald-900/60 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Recording Authority: <strong>{currentUser?.name || 'Saif Ahmed Sakil'}</strong> ({currentUser?.officialDesignation || currentUser?.role || 'SYSTEM_ADMIN'})
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400/80">
                Society Ledger Version Active
              </span>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-6 flex-1 text-xs">
              {/* SECTION A: PARTIES TO THE CONVEYANCE (FROM & TO MEMBERS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. Transferor (From Member) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>1. Transferor (Source Shareholder)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Relinquishing Party</span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Select Member Account:</label>
                    <select
                      value={transferFromMemberId}
                      onChange={(e) => {
                        const mid = e.target.value;
                        setTransferFromMemberId(mid);
                        const mObj = members.find((m) => m.id === mid);
                        if (mObj) {
                          setTransferShareNumber(mObj.shareNumber);
                          setTransferAmount(getMemberDeposits(mObj));
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {members.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id} - {m.name} (Share #{m.shareNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFromMember && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shareholder Name:</span>
                        <span className="font-semibold text-white">{selectedFromMember.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Controlling Director:</span>
                        <span className="text-emerald-400">{selectedFromMember.controllingDirectorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Total Deposits:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatBDT(getMemberDeposits(selectedFromMember))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Project Expense Quota:</span>
                        <span className="font-mono text-slate-300">
                          {formatBDT(financials.perShareExpense)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Net Ledger Balance:</span>
                        <span
                          className={`font-mono font-bold ${
                            getMemberDeposits(selectedFromMember) - financials.perShareExpense >= 0
                              ? 'text-teal-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatBDT(getMemberDeposits(selectedFromMember) - financials.perShareExpense)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Transferee (To Member) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>2. Transferee (Recipient Shareholder)</span>
                    </label>
                    <span className="text-[10px] text-slate-500">Acquiring Party</span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Select Member Account:</label>
                    <select
                      value={transferToMemberId}
                      onChange={(e) => setTransferToMemberId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    >
                      {members
                        .filter((m) => m.id !== transferFromMemberId)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} - {m.name} (Share #{m.shareNumber})
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedToMember && (
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shareholder Name:</span>
                        <span className="font-semibold text-white">{selectedToMember.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Controlling Director:</span>
                        <span className="text-emerald-400">{selectedToMember.controllingDirectorName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Current Total Deposits:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {formatBDT(getMemberDeposits(selectedToMember))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Project Expense Quota:</span>
                        <span className="font-mono text-slate-300">
                          {formatBDT(financials.perShareExpense)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Net Ledger Balance:</span>
                        <span
                          className={`font-mono font-bold ${
                            getMemberDeposits(selectedToMember) - financials.perShareExpense >= 0
                              ? 'text-teal-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {formatBDT(getMemberDeposits(selectedToMember) - financials.perShareExpense)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: TERMS OF TRANSFER & FINANCIAL DETAILS */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>3. Transfer Terms, Consideration & Society Fee</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Share Number Being Transferred */}
                  <div>
                    <label className="block text-slate-400 mb-1">Transferred Share #</label>
                    <input
                      type="number"
                      min={1}
                      max={144}
                      value={transferShareNumber}
                      onChange={(e) => setTransferShareNumber(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Share unit being conveyed (1 to 144)
                    </span>
                  </div>

                  {/* Transfer Category */}
                  <div>
                    <label className="block text-slate-400 mb-1">Conveyance Category</label>
                    <select
                      value={transferCategory}
                      onChange={(e) => setTransferCategory(e.target.value as ShareTransferCategory)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                    >
                      <option value="FULL_OWNERSHIP_TRANSFER">Full Share Ownership Transfer</option>
                      <option value="CAPITAL_BALANCE_TRANSFER">Capital Balance / Equity Transfer</option>
                      <option value="SECONDARY_MARKET_SALE">Secondary Market Sale</option>
                      <option value="FAMILY_NOMINEE_INHERITANCE">Family Nominee / Inheritance</option>
                      <option value="DIRECTOR_QUOTA_REALLOCATION">Director Quota Reallocation</option>
                    </select>
                  </div>

                  {/* Transfer Date */}
                  <div>
                    <label className="block text-slate-400 mb-1">Effective Transfer Date</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={(e) => setTransferDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Transferred Amount */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">Transferred Capital (BDT ৳)</label>
                      {selectedFromMember && (
                        <button
                          type="button"
                          onClick={() => setTransferAmount(getMemberDeposits(selectedFromMember))}
                          className="text-[10px] text-emerald-400 hover:underline"
                        >
                          All Deposits
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="e.g. 250000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-emerald-400 focus:border-emerald-500"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Debited from Transferor, Credited to Transferee
                    </span>
                  </div>

                  {/* Society Processing Fee */}
                  <div>
                    <label className="block text-slate-400 mb-1">Society Processing Fee (BDT ৳)</label>
                    <input
                      type="number"
                      min={0}
                      value={transferFeeBDT}
                      onChange={(e) => setTransferFeeBDT(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Official fee credited to Society income ledger
                    </span>
                  </div>

                  {/* Fee Payer */}
                  <div>
                    <label className="block text-slate-400 mb-1">Transfer Fee Paid By</label>
                    <select
                      value={transferFeePayer}
                      onChange={(e) => setTransferFeePayer(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                    >
                      <option value="TRANSFEREE">Transferee (Buyer / Recipient)</option>
                      <option value="TRANSFEROR">Transferor (Seller / Source)</option>
                      <option value="EXEMPT">Waived / Society Exempt (৳0)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Payment Method */}
                  <div>
                    <label className="block text-slate-400 mb-1">Settlement Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                    >
                      <option value="Bank Transfer">Bank Transfer (EBL / IBBL / DBBL)</option>
                      <option value="Pay Order">Bank Pay Order</option>
                      <option value="Cheque">Bank Cheque</option>
                      <option value="bKash / Nagad">Mobile Financial Services (bKash/Nagad)</option>
                      <option value="Cash">Cash in Society Escrow</option>
                    </select>
                  </div>

                  {/* Bank Reference / Trx No */}
                  <div>
                    <label className="block text-slate-400 mb-1">Instrument / Bank Trx No (Optional)</label>
                    <input
                      type="text"
                      value={bankReferenceNumber}
                      onChange={(e) => setBankReferenceNumber(e.target.value)}
                      placeholder="e.g. EBL-PO-44829 or Trx ID"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: GOVERNANCE, LEGAL INSTRUMENT & AUDIT RESOLUTION */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>4. Governance Resolution & Legal Deed Reference</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* EC Resolution */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400">EC / Board Resolution Ref # *</label>
                      <button
                        type="button"
                        onClick={() =>
                          setResolutionNumber(`EC-RES-2026-${String(Math.floor(10 + Math.random() * 89))}`)
                        }
                        className="text-[10px] text-emerald-400 hover:underline"
                      >
                        Auto-Gen
                      </button>
                    </div>
                    <input
                      type="text"
                      value={resolutionNumber}
                      onChange={(e) => setResolutionNumber(e.target.value)}
                      placeholder="e.g. EC-RES-2026-024"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Registered Deed / Stamp No */}
                  <div>
                    <label className="block text-slate-400 mb-1">Registered Deed / Stamp Ref (Optional)</label>
                    <input
                      type="text"
                      value={deedOrStampNumber}
                      onChange={(e) => setDeedOrStampNumber(e.target.value)}
                      placeholder="e.g. DEED-4892/2026 or 300 Tk Non-Judicial Stamp"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Transfer Purpose / Reason</label>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      placeholder="e.g. Plot quota conveyance by mutual consent"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Official Audit Remarks (Optional)</label>
                    <input
                      type="text"
                      value={transferRemarks}
                      onChange={(e) => setTransferRemarks(e.target.value)}
                      placeholder="e.g. Verified by Accounts Officer and approved in EC meeting #24"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION D: LIVE RECONCILIATION PREVIEW */}
              {selectedFromMember && selectedToMember && (
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-3">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>5. Live Ledger Reconciliation Preview</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="font-bold text-rose-400 block mb-1">
                        Transferor: {selectedFromMember.name} ({selectedFromMember.id})
                      </span>
                      <div className="flex justify-between text-slate-400">
                        <span>Deposits Before:</span>
                        <span className="font-mono text-white">
                          {formatBDT(getMemberDeposits(selectedFromMember))}
                        </span>
                      </div>
                      <div className="flex justify-between text-rose-300 font-semibold">
                        <span>Transfer Out Debit:</span>
                        <span className="font-mono">-{formatBDT(Number(transferAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                        <span>New Deposit Total:</span>
                        <span className="font-mono text-emerald-400">
                          {formatBDT(getMemberDeposits(selectedFromMember) - (Number(transferAmount) || 0))}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1.5">
                      <span className="font-bold text-emerald-400 block mb-1">
                        Transferee: {selectedToMember.name} ({selectedToMember.id})
                      </span>
                      <div className="flex justify-between text-slate-400">
                        <span>Deposits Before:</span>
                        <span className="font-mono text-white">
                          {formatBDT(getMemberDeposits(selectedToMember))}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-300 font-semibold">
                        <span>Transfer In Credit:</span>
                        <span className="font-mono">+{formatBDT(Number(transferAmount) || 0)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800 font-bold">
                        <span>New Deposit Total:</span>
                        <span className="font-mono text-emerald-400">
                          {formatBDT(getMemberDeposits(selectedToMember) + (Number(transferAmount) || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTransfer}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>
                    {isSubmittingTransfer ? 'Committing to Ledger...' : 'Commit & Execute Share Transfer'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PRINTABLE OFFICIAL SHARE TRANSFER CERTIFICATE                    */}
      {/* ========================================================================= */}
      {selectedCertificateTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col text-slate-200">
            {/* Modal Header Toolbar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white text-sm">
                  Official Share Conveyance Certificate (#{selectedCertificateTransfer.id})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  onClick={() => setSelectedCertificateTransfer(null)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Paper */}
            <div className="p-8 bg-slate-950 text-slate-200 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
              {/* Society Formal Header */}
              <div className="text-center pb-4 border-b-2 border-emerald-500/40 space-y-1">
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
                  Government Registered Cooperative Society • Reg No. PHS-144/2014
                </div>
                <h1 className="text-xl font-extrabold text-white tracking-wide uppercase">
                  Prottasha Housing Society Limited
                </h1>
                <p className="text-xs text-slate-400">
                  Central Secretariat & Directorate Portfolio Escrow • 144 Shares Capital Architecture
                </p>
                <div className="inline-block px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full font-bold text-[11px] uppercase tracking-wider mt-2">
                  Share Transfer & Conveyance Certificate
                </div>
              </div>

              {/* Certificate Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Certificate Ref:</span>
                  <span className="font-bold text-emerald-400">{selectedCertificateTransfer.id}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Date of Transfer:</span>
                  <span className="text-white">{selectedCertificateTransfer.transferDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Share Unit #:</span>
                  <span className="font-bold text-amber-300">
                    Share #{selectedCertificateTransfer.transferredShareNumber} of 144
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase">Board Resolution:</span>
                  <span className="text-white">{selectedCertificateTransfer.resolutionNumber}</span>
                </div>
              </div>

              {/* Parties Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 block border-b border-slate-800 pb-1">
                    Transferor (Transferring Shareholder)
                  </span>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-400">Full Name: </span>
                      <strong className="text-white">{selectedCertificateTransfer.fromMemberName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Member ID: </span>
                      <span className="font-mono text-slate-300">{selectedCertificateTransfer.fromMemberId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Original Directorate: </span>
                      <span className="text-emerald-400">{selectedCertificateTransfer.fromDirectorName}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block border-b border-slate-800 pb-1">
                    Transferee (Acquiring Shareholder)
                  </span>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-slate-400">Full Name: </span>
                      <strong className="text-white">{selectedCertificateTransfer.toMemberName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Member ID: </span>
                      <span className="font-mono text-slate-300">{selectedCertificateTransfer.toMemberId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Directorate Quota: </span>
                      <span className="text-emerald-400">{selectedCertificateTransfer.toDirectorName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conveyance Particulars Table */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block border-b border-slate-800 pb-1">
                  Financial Terms & Conveyance Details
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block">Transferred Deposit Capital:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {formatBDT(selectedCertificateTransfer.transferredAmount)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Society Processing Fee:</span>
                    <strong className="text-slate-200 font-mono text-sm">
                      {formatBDT(selectedCertificateTransfer.transferFeeBDT)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Settlement Method:</span>
                    <strong className="text-white font-mono">
                      {selectedCertificateTransfer.paymentMethod}
                    </strong>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block">Conveyance Classification:</span>
                    <span className="text-slate-200">{selectedCertificateTransfer.transferCategory}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Deed / Stamp Reference:</span>
                    <span className="font-mono text-slate-300">
                      {selectedCertificateTransfer.deedOrStampNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Attestation Text */}
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                This document certifies that under Executive Committee Resolution #{selectedCertificateTransfer.resolutionNumber}, the rights, allotment claim, and financial ledger credits appertaining to registered Share #{selectedCertificateTransfer.transferredShareNumber} of Prottasha Housing Society have been officially conveyed from {selectedCertificateTransfer.fromMemberName} to {selectedCertificateTransfer.toMemberName}. Both personal ledgers stand reconciled in the Society Central Database.
              </div>

              {/* Signature Blocks */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-[10px] text-slate-400">
                <div className="border-t border-slate-700 pt-2">
                  <div className="font-semibold text-slate-300">Transferor Signature</div>
                  <div className="text-[9px] mt-0.5">{selectedCertificateTransfer.fromMemberName}</div>
                </div>

                <div className="border-t border-slate-700 pt-2">
                  <div className="font-semibold text-slate-300">Transferee Signature</div>
                  <div className="text-[9px] mt-0.5">{selectedCertificateTransfer.toMemberName}</div>
                </div>

                <div className="border-t border-slate-700 pt-2">
                  <div className="font-semibold text-emerald-400">Recorded Official & Seal</div>
                  <div className="text-[9px] mt-0.5">
                    {selectedCertificateTransfer.recordedByName} (
                    {selectedCertificateTransfer.recordedByDesignation || 'Official'})
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

