import React, { useState, useEffect } from 'react';
import {
  User,
  Wallet,
  Building,
  CheckCircle,
  AlertCircle,
  Printer,
  Download,
  Calendar,
  CreditCard,
  Lock,
  ArrowRight,
  ShieldCheck,
  Search,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { IncomeEntry, ExpenseEntry, Member, User as UserType } from '../types';
import {
  computeMemberSummary,
  computeProjectFinancials,
  formatBDT,
  MemberFinancialSummary,
} from '../utils/calculations';
import { storageService } from '../services/storageService';
import { formatMemberId, TOTAL_SHARES } from '../utils/directors';

interface MemberStatementViewProps {
  incomes: IncomeEntry[];
  expenses: ExpenseEntry[];
  members: Member[];
  currentUser: UserType | null;
  initialMemberId?: string;
  onPrintStatement?: (summary: MemberFinancialSummary, deposits: IncomeEntry[]) => void;
}

export const MemberStatementView: React.FC<MemberStatementViewProps> = ({
  incomes,
  expenses,
  members,
  currentUser,
  initialMemberId,
  onPrintStatement,
}) => {
  const isMember = currentUser?.role === 'MEMBER';
  const loggedMemberId = currentUser?.memberId || 'PHSM-001';

  // If member is logged in, strict isolation: lock to their own ID
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    isMember ? loggedMemberId : initialMemberId || 'PHSM-001'
  );

  useEffect(() => {
    if (!isMember && initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId, isMember]);

  const activeId = isMember ? loggedMemberId : selectedMemberId;
  const currentMember = members.find((m) => m.id === activeId) || members[0];

  const summary = computeMemberSummary(currentMember, incomes, expenses);
  const financials = computeProjectFinancials(incomes, expenses);

  // All deposits for this member
  const memberDeposits = incomes.filter(
    (inc) =>
      !inc.isSoftDeleted &&
      inc.type === 'GENERAL_DEPOSIT' &&
      (inc.shareOwnerId === currentMember.id || inc.shareNumber === currentMember.shareNumber)
  );

  const isAdvance = summary.currentBalance >= 0;

  const handleExportCSV = () => {
    const lines = [
      `"PROTTASHA HOUSING SOCIETY LTD. - SHAREHOLDER FINANCIAL STATEMENT"`,
      `"Statement Generated: ${new Date().toLocaleDateString('en-GB')}"`,
      `"Member ID:","${currentMember.id}"`,
      `"Member Name:","${currentMember.name}"`,
      `"Share Allocation:","Share #${currentMember.shareNumber} of 144"`,
      `"Controlling Director:","${currentMember.controllingDirectorName}"`,
      `"Contact Phone:","${currentMember.phone}"`,
      `"Contact Email:","${currentMember.email}"`,
      `"Assigned Plot:","${currentMember.address}"`,
      ``,
      `"--- FINANCIAL SUMMARY MATRIX (BDT ৳) ---"`,
      `"Total Personal Deposits (Joma):","${summary.memberPersonalDeposit}"`,
      `"Share Expense Quota (Khorch 1/144):","${summary.memberShareExpense}"`,
      `"Current Net Balance:","${summary.currentBalance}"`,
      `"Balance Status:","${isAdvance ? 'SURPLUS ADVANCE' : 'PENDING DUES'}"`,
      ``,
      `"--- ITEMIZED DEPOSIT TRANSACTIONS (JOMA) ---"`,
      `"Deposit ID","Date","Category","Payment Method","Reference Number","Amount (BDT)","Status","Remarks"`,
    ];

    memberDeposits.forEach((dep) => {
      lines.push(
        `"${dep.id}","${dep.date}","${(dep.category || '').replace(/"/g, '""')}","${dep.paymentMethod}","${dep.referenceNumber || 'N/A'}","${dep.amount}","${dep.status}","${(dep.remarks || '').replace(/"/g, '""')}"`
      );
    });

    lines.push(``);
    lines.push(`"Total Verified Deposits Credited","","","","","${summary.memberPersonalDeposit}","",""`);

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PHS_Financial_Statement_${currentMember.id}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintOrPDF = () => {
    if (onPrintStatement) {
      onPrintStatement(summary, memberDeposits);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Member Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Official Shareholder Ledger
              </span>
              {isMember && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  <Lock className="w-3 h-3 text-indigo-400" />
                  <span>Strict Data Isolation Active</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Financial Statement (Joma & Khorch)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Personal deposit ledger vs equal project expense quota (1/144th share allocation).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* If Admin/Manager, show Dropdown Filter to inspect any of the 144 members */}
            {!isMember ? (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Select Member:</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} - {m.name} (Share #{m.shareNumber})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400">
                Your Share ID: <strong>{currentMember.id}</strong> (Share #{currentMember.shareNumber})
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                title="Export detailed statement to formatted CSV"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handlePrintOrPDF}
                title="Export to formatted PDF with official letterhead and signatures"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1.5 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export Formatted PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Member Profile & High Level Financial Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Dossier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-base shadow">
              {currentMember.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{currentMember.name}</h3>
              <div className="text-xs font-mono text-emerald-400">
                Member ID: {currentMember.id}
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Registered Share Number:</span>
              <span className="font-mono font-bold text-white">Share #{currentMember.shareNumber} of 144</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Controlling Director:</span>
              <span className="font-semibold text-emerald-400">{currentMember.controllingDirectorName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Contact Mobile:</span>
              <span className="text-slate-200">{currentMember.phone}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Email Address:</span>
              <span className="text-slate-200">{currentMember.email}</span>
            </div>
            <div className="flex justify-between items-start py-1">
              <span className="text-slate-400">Assigned Plot Address:</span>
              <span className="text-slate-300 text-right max-w-[60%]">{currentMember.address}</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Certified Shareholder of Prottasha Housing Society.</span>
            </div>
          </div>
        </div>

        {/* Middle & Right: The 4 Core Financial Metrics */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Metric 1: Member Personal Deposit */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Total Personal Deposits (Joma)
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatBDT(summary.memberPersonalDeposit)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Total approved funds deposited against {currentMember.id}
              </div>
            </div>

            {/* Metric 2: Member Share Expense */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Share Expense Quota (Khorch)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-200">
                {formatBDT(summary.memberShareExpense)}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">
                Strict formula: Total Project Expense / 144
              </div>
            </div>

            {/* Metric 3: Current Net Balance */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Current Net Balance (Joma − Khorch)
              </div>
              <div
                className={`text-2xl font-bold font-mono ${
                  isAdvance ? 'text-teal-400' : 'text-rose-400'
                }`}
              >
                {formatBDT(summary.currentBalance)}
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAdvance
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {isAdvance ? 'Surplus Advance' : 'Pending Dues Payable'}
                </span>
              </div>
            </div>
          </div>

          {/* Macro Project Reference Strip */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-slate-400">Global Reference: </span>
              <span>Total Project Expense: <strong className="text-white font-mono">{formatBDT(financials.totalProjectExpense)}</strong></span>
              <span className="text-slate-500 mx-2">|</span>
              <span>Divided by: <strong className="text-emerald-400 font-mono">144 Shares</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Share Quota = {formatBDT(financials.perShareExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* Member Personal Deposit History (Joma Breakdown) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span>Personal Deposit Transactions ({currentMember.id})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified payment receipts credited towards Share #{currentMember.shareNumber}.
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Total Deposits: <strong className="text-emerald-400 font-mono">{formatBDT(summary.memberPersonalDeposit)}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Deposit ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference / Trx No</th>
                <th className="py-3 px-4 text-right">Amount (BDT)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {memberDeposits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                    No deposit records found for Member {currentMember.id}.
                  </td>
                </tr>
              ) : (
                memberDeposits.map((dep) => (
                  <tr key={dep.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-200">
                      {dep.id}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {dep.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {dep.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {dep.paymentMethod}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {dep.referenceNumber || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatBDT(dep.amount)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          dep.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {dep.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {dep.remarks || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-950 font-semibold text-slate-200 border-t border-slate-800 text-xs">
              <tr>
                <td colSpan={5} className="py-3 px-4 font-bold text-slate-300">
                  Total Approved Personal Deposits
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                  {formatBDT(summary.memberPersonalDeposit)}
                </td>
                <td colSpan={2} className="py-3 px-4 text-right text-slate-500 text-[11px]">
                  Net Status: {isAdvance ? 'Advance Surplus' : 'Dues Payable'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
