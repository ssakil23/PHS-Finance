import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  X,
  UserCheck,
  CheckCircle2,
  DollarSign,
  Percent,
  FileText,
  ShieldAlert,
  ArrowDownCircle,
  TrendingUp,
  Info,
  Calendar,
  CreditCard,
} from 'lucide-react';
import { Member, User, IncomeEntry, ExpenseEntry, ImposePenaltyInput, PenaltyImpositionType, PaymentMethod } from '../types';
import { storageService } from '../services/storageService';
import { computeMemberSummary, formatBDT } from '../utils/calculations';

interface ImposePenaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  members: Member[];
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  preselectedMemberId?: string;
  onPenaltyImposed?: () => void;
}

const COMMON_PENALTY_REASONS = [
  'Late payment of Phase 1 Infrastructure Installment',
  'Late payment of Phase 2 Land Development Call',
  'Overdue Electrical Substation Fund Installment',
  'Delayed Drainage & Boundary Wall Contribution',
  'Late 4th Unit Collective Fund Installment',
  'Delayed Member Monthly Operational Contribution',
  'Administrative Surcharge for Overdue Default',
];

export const ImposePenaltyModal: React.FC<ImposePenaltyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  members,
  incomes,
  expenses,
  preselectedMemberId,
  onPenaltyImposed,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    preselectedMemberId || (members[0]?.id || 'PHSM-001')
  );
  const [impositionType, setImpositionType] = useState<PenaltyImpositionType>('MANUAL_FIXED');
  const [fixedAmount, setFixedAmount] = useState<string>('2000');
  const [percentageRate, setPercentageRate] = useState<string>('5');
  const [reason, setReason] = useState<string>(COMMON_PENALTY_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Find target member
  const targetMember = useMemo(() => {
    return members.find((m) => m.id === selectedMemberId) || members[0];
  }, [members, selectedMemberId]);

  // Compute live member financials to know current deposit and overdue amount
  const penalties = useMemo(() => storageService.getPenalties(), [isOpen]);
  const memberFinancialSummary = useMemo(() => {
    if (!targetMember) return null;
    return computeMemberSummary(targetMember, incomes, expenses, penalties);
  }, [targetMember, incomes, expenses, penalties]);

  const overdueDueAmount = useMemo(() => {
    if (!memberFinancialSummary) return 0;
    return memberFinancialSummary.currentBalance < -0.01
      ? Math.abs(memberFinancialSummary.currentBalance)
      : 0;
  }, [memberFinancialSummary]);

  // Calculate calculated penalty amount
  const calculatedPenaltyAmount = useMemo(() => {
    if (impositionType === 'MANUAL_FIXED') {
      const num = parseFloat(fixedAmount);
      return isNaN(num) || num <= 0 ? 0 : num;
    } else {
      const rate = parseFloat(percentageRate);
      if (isNaN(rate) || rate <= 0) return 0;
      // If member has overdue balance, use that; otherwise allow minimum base of 20,000 BDT
      const base = overdueDueAmount > 0 ? overdueDueAmount : 20000;
      return Math.round((base * (rate / 100)) * 100) / 100;
    }
  }, [impositionType, fixedAmount, percentageRate, overdueDueAmount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const finalReason = reason === 'OTHER' ? customReason.trim() : reason;
    if (!finalReason) {
      setError('Please provide a specific reason for imposing this penalty.');
      return;
    }

    if (calculatedPenaltyAmount <= 0) {
      setError('Penalty amount must be greater than ৳0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: ImposePenaltyInput = {
        memberId: targetMember.id,
        impositionType,
        penaltyAmount: calculatedPenaltyAmount,
        percentageRate: impositionType === 'PERCENTAGE_DUE' ? parseFloat(percentageRate) : undefined,
        dueBaseAmount: impositionType === 'PERCENTAGE_DUE' ? overdueDueAmount : undefined,
        reason: finalReason,
        category: 'Late Payment Penalty',
        notes: notes.trim() || undefined,
        paymentMethod,
      };

      const record = storageService.imposePenalty(input, currentUser);
      setSuccessMessage(
        `Successfully imposed penalty of ${formatBDT(record.penaltyAmount)} on ${record.memberName} (Share #${record.shareNumber}). Double-entry recorded: credited to Society Income & auto-deducted from member deposit.`
      );

      if (onPenaltyImposed) {
        onPenaltyImposed();
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to impose penalty.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" />
                <span>Executive Authority</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">System Admin / Delegated</span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Impose Shareholder Late Penalty</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Impose penalty on late payment of installments or society dues manually or as a % of overdue amount.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Share Owner Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Share Owner (Share 1 - 144)
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 transition font-sans"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  Share #{m.shareNumber}: {m.name} ({m.id}) - {m.controllingDirectorName}
                </option>
              ))}
            </select>
          </div>

          {/* Member Financial Snapshot Card */}
          {targetMember && memberFinancialSummary && (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between font-semibold text-slate-300 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>{targetMember.name} (Share #{targetMember.shareNumber})</span>
                </span>
                <span className="text-slate-400 font-mono">{targetMember.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Gross Deposit</div>
                  <div className="text-emerald-400 font-bold">
                    {formatBDT(memberFinancialSummary.memberPersonalDeposit)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Quota Obligation</div>
                  <div className="text-slate-300">
                    {formatBDT(memberFinancialSummary.memberShareExpense)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Current Balance</div>
                  <div
                    className={`font-bold ${
                      memberFinancialSummary.currentBalance < -0.01
                        ? 'text-rose-400'
                        : 'text-teal-400'
                    }`}
                  >
                    {memberFinancialSummary.currentBalance < -0.01
                      ? `Due: ${formatBDT(Math.abs(memberFinancialSummary.currentBalance))}`
                      : `Advance: ${formatBDT(memberFinancialSummary.currentBalance)}`}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Imposition Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Penalty Imposition Mode
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setImpositionType('MANUAL_FIXED')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  impositionType === 'MANUAL_FIXED'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <DollarSign className="w-4 h-4 text-rose-400" />
                <span>Manual Fixed Amount</span>
              </button>

              <button
                type="button"
                onClick={() => setImpositionType('PERCENTAGE_DUE')}
                className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                  impositionType === 'PERCENTAGE_DUE'
                    ? 'bg-rose-950/60 border-rose-500 text-rose-200 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Percent className="w-4 h-4 text-rose-400" />
                <span>% of Due / Overdue Amount</span>
              </button>
            </div>
          </div>

          {/* Amount Inputs */}
          {impositionType === 'MANUAL_FIXED' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Fixed Penalty Amount (BDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">৳</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                  placeholder="e.g. 2500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter an exact monetary surcharge to impose on late installment compliance.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Penalty Percentage Rate (%)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['2', '5', '10', '15'].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPercentageRate(rate)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                      percentageRate === rate
                        ? 'bg-rose-600 text-white border-rose-500'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-bold">%</span>
                <input
                  type="number"
                  min="0.5"
                  max="50"
                  step="0.5"
                  value={percentageRate}
                  onChange={(e) => setPercentageRate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                  placeholder="Custom % rate"
                />
              </div>
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80 font-mono">
                Baseline Overdue Balance:{' '}
                <strong className="text-amber-300">
                  {overdueDueAmount > 0 ? formatBDT(overdueDueAmount) : '৳ 20,000 (Default Call)'}
                </strong>{' '}
                × {percentageRate}% ={' '}
                <strong className="text-rose-400 font-bold">
                  {formatBDT(calculatedPenaltyAmount)}
                </strong>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Reason for Penalty
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            >
              {COMMON_PENALTY_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="OTHER">Custom Reason...</option>
            </select>

            {reason === 'OTHER' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify penalty grounds & resolution number..."
                className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                required
              />
            )}
          </div>

          {/* Payment Method Treatment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ledger Entry Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Cash">Cash Adjustment</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="bKash / Nagad">bKash / Nagad</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Admin Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. EC Meeting #24 decision"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Double-Entry Financial Mechanism Explanatory Box */}
          <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-emerald-950/40 border border-rose-900/40 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold uppercase tracking-wider text-[11px]">
              <Info className="w-3.5 h-3.5 text-rose-400" />
              <span>Double-Entry & Auto-Deduction Principle</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-emerald-800/40">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+ Credited as System Income</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Penalty of <strong className="font-mono text-white">{formatBDT(calculatedPenaltyAmount)}</strong> is booked as Society System Income (General Deposit ledger).
                </div>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-rose-800/40">
                <div className="text-rose-400 font-bold flex items-center gap-1">
                  <ArrowDownCircle className="w-3.5 h-3.5" />
                  <span>- Auto-Deducted from Deposits</span>
                </div>
                <div className="text-slate-300 mt-1">
                  Automatically deducted from {targetMember.name}'s verified deposits and displayed in{' '}
                  <span className="text-rose-400 font-bold">Red Colour</span> on their statement.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculatedPenaltyAmount <= 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-semibold text-xs shadow-lg shadow-rose-950/50 transition cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>
                {isSubmitting
                  ? 'Imposing Penalty...'
                  : `Confirm & Impose Penalty (${formatBDT(calculatedPenaltyAmount)})`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
